terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" }
    random  = { source = "hashicorp/random", version = "~> 3.6" }
    null    = { source = "hashicorp/null", version = "~> 3.2" }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

variable "subscription_id" { type = string }
variable "location" {
  type    = string
  default = "polandcentral"
}
variable "prefix" {
  type    = string
  default = "atomsapi"
}
variable "github_repo" {
  type        = string
  description = "owner/repo, наприклад RomanPorada/cloud-lab1"
}
variable "alert_email" { type = string }

locals {
  acr_name = "${var.prefix}${random_string.suffix.result}"
}

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

# Пароль БД генерується Terraform-ом: ніде в коді/репозиторії його немає
resource "random_password" "db" {
  length  = 24
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.prefix}"
  location = var.location
}

# ---------------- Мережа ----------------
resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-${var.prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "appgw" {
  name                 = "snet-appgw"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "app" {
  name                 = "snet-app"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/26"]
  delegation {
    name = "aca"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_subnet" "db" {
  name                 = "snet-db"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.3.0/24"]
  delegation {
    name = "pg"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# NSG бази: 5432 лише з підмережі застосунку, усе інше з VNet заборонено
resource "azurerm_network_security_group" "db" {
  name                = "nsg-db"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "allow-postgres-from-app"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = azurerm_subnet.app.address_prefixes[0]
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "deny-all-other-vnet"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = azurerm_subnet.db.id
  network_security_group_id = azurerm_network_security_group.db.id
}

# ---------------- Керована SQL-база (PostgreSQL, лише приватний доступ) ----------------
resource "azurerm_private_dns_zone" "pg" {
  name                = "${var.prefix}.private.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "pg" {
  name                  = "pg-link"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.pg.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_postgresql_flexible_server" "db" {
  name                          = "psql-${var.prefix}-${random_string.suffix.result}"
  resource_group_name           = azurerm_resource_group.rg.name
  location                      = azurerm_resource_group.rg.location
  version                       = "16"
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  backup_retention_days         = 7
  zone                          = "1"
  administrator_login           = "pgadmin"
  administrator_password        = random_password.db.result
  delegated_subnet_id           = azurerm_subnet.db.id
  private_dns_zone_id           = azurerm_private_dns_zone.pg.id
  public_network_access_enabled = false

  depends_on = [azurerm_private_dns_zone_virtual_network_link.pg]
}

resource "azurerm_postgresql_flexible_server_database" "atoms" {
  name      = "atoms"
  server_id = azurerm_postgresql_flexible_server.db.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# ---------------- Реєстр образів ----------------
resource "azurerm_container_registry" "acr" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = false
}

# Перший образ збираємо й пушимо під час apply (потрібні docker і `az login` локально),
# щоб Container App мав що запускати. Далі образи оновлює GitHub Actions.
resource "null_resource" "bootstrap_image" {
  triggers = { acr = azurerm_container_registry.acr.id }
  provisioner "local-exec" {
    command = "az acr login --name ${azurerm_container_registry.acr.name} && docker build --platform linux/amd64 -t ${azurerm_container_registry.acr.login_server}/api:bootstrap ${path.module}/.. && docker push ${azurerm_container_registry.acr.login_server}/api:bootstrap"
  }
}

# ---------------- Логи + середовище Container Apps ----------------
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-${var.prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "env" {
  name                           = "cae-${var.prefix}"
  location                       = azurerm_resource_group.rg.location
  resource_group_name            = azurerm_resource_group.rg.name
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.logs.id
  infrastructure_subnet_id       = azurerm_subnet.app.id
  internal_load_balancer_enabled = true # напряму з інтернету середовище недоступне

  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }
}

resource "azurerm_user_assigned_identity" "app" {
  name                = "id-${var.prefix}-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_role_assignment" "app_acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

resource "azurerm_container_app" "api" {
  name                         = "ca-${var.prefix}"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  registry {
    server   = azurerm_container_registry.acr.login_server
    identity = azurerm_user_assigned_identity.app.id
  }

  secret {
    name  = "db-password"
    value = random_password.db.result
  }

  secret {
    name  = "jwt-secret"
    value = random_password.jwt.result
  }

  ingress {
    external_enabled           = true # у внутрішньому середовищі = доступно лише з VNet
    target_port                = 3000
    transport                  = "auto"
    allow_insecure_connections = true
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "api"
      image  = "${azurerm_container_registry.acr.login_server}/api:bootstrap"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "DB_HOST"
        value = azurerm_postgresql_flexible_server.db.fqdn
      }
      env {
        name  = "DB_USER"
        value = "pgadmin"
      }
      env {
        name  = "DB_NAME"
        value = azurerm_postgresql_flexible_server_database.atoms.name
      }
      env {
        name  = "DB_SSL"
        value = "true"
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/health"
      }
    }
  }

  # Образ далі змінює CI/CD — Terraform не повинен його відкочувати
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [azurerm_role_assignment.app_acr_pull, null_resource.bootstrap_image, azurerm_postgresql_flexible_server_database.atoms]
}

# ---------------- Балансувальник: Application Gateway ----------------
resource "azurerm_public_ip" "agw" {
  name                = "pip-${var.prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = "${var.prefix}-${random_string.suffix.result}"
}

locals {
  app_fqdn = azurerm_container_app.api.ingress[0].fqdn
}

resource "azurerm_application_gateway" "agw" {
  name                = "agw-${var.prefix}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 1
  }

  gateway_ip_configuration {
    name      = "gw-ip"
    subnet_id = azurerm_subnet.appgw.id
  }
  frontend_port {
    name = "http"
    port = 80
  }
  frontend_ip_configuration {
    name                 = "public"
    public_ip_address_id = azurerm_public_ip.agw.id
  }

  backend_address_pool {
    name         = "aca"
    ip_addresses = [azurerm_container_app_environment.env.static_ip_address]
  }

  probe {
    name                = "health"
    protocol            = "Http"
    host                = local.app_fqdn
    path                = "/health"
    interval            = 15
    timeout             = 10
    unhealthy_threshold = 3
    match {
      status_code = ["200-399"]
    }
  }

  backend_http_settings {
    name                                = "aca-http"
    cookie_based_affinity               = "Disabled"
    port                                = 80
    protocol                            = "Http"
    request_timeout                     = 30
    host_name                           = local.app_fqdn
    pick_host_name_from_backend_address = false
    probe_name                          = "health"
  }

  http_listener {
    name                           = "listener"
    frontend_ip_configuration_name = "public"
    frontend_port_name             = "http"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "rule"
    rule_type                  = "Basic"
    priority                   = 100
    http_listener_name         = "listener"
    backend_address_pool_name  = "aca"
    backend_http_settings_name = "aca-http"
  }
}

# ---------------- OIDC для GitHub Actions (без збережених ключів) ----------------
resource "azurerm_user_assigned_identity" "gh" {
  name                = "id-${var.prefix}-github"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_federated_identity_credential" "gh_main" {
  name                = "github-lab1"
  resource_group_name = azurerm_resource_group.rg.name
  parent_id           = azurerm_user_assigned_identity.gh.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = "repo:${var.github_repo}:ref:refs/heads/lab1"
}

resource "azurerm_role_assignment" "gh_acr_push" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_user_assigned_identity.gh.principal_id
}

resource "azurerm_role_assignment" "gh_deploy" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.gh.principal_id
}

# ---------------- Бонус: алерт на 5xx (email) ----------------
resource "azurerm_monitor_action_group" "email" {
  name                = "ag-${var.prefix}"
  resource_group_name = azurerm_resource_group.rg.name
  short_name          = "atomsapi"
  email_receiver {
    name          = "owner"
    email_address = var.alert_email
  }
}

resource "azurerm_monitor_metric_alert" "http5xx" {
  name                = "alert-5xx"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_application_gateway.agw.id]
  description         = "5xx від бекенду за балансувальником"
  frequency           = "PT1M"
  window_size         = "PT5M"
  severity            = 2
  criteria {
    metric_namespace = "Microsoft.Network/applicationGateways"
    metric_name      = "BackendResponseStatus"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 0
    dimension {
      name     = "HttpStatusGroup"
      operator = "Include"
      values   = ["5xx"]
    }
  }
  action {
    action_group_id = azurerm_monitor_action_group.email.id
  }
}

# ---------------- Outputs ----------------
output "public_url" { value = "http://${azurerm_public_ip.agw.fqdn}" }
output "acr_name" { value = azurerm_container_registry.acr.name }
output "acr_login_server" { value = azurerm_container_registry.acr.login_server }
output "resource_group" { value = azurerm_resource_group.rg.name }
output "container_app" { value = azurerm_container_app.api.name }
output "github_client_id" { value = azurerm_user_assigned_identity.gh.client_id }
output "tenant_id" { value = azurerm_user_assigned_identity.gh.tenant_id }
output "db_host" { value = azurerm_postgresql_flexible_server.db.fqdn }
output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
