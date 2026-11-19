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

  secret {
    name  = "redis-url"
    value = "redis://:${random_password.redis.result}@${azurerm_container_app.redis.name}:6379"
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
    min_replicas                = var.min_replicas
    max_replicas                = var.max_replicas
    cooldown_period_in_seconds  = var.cooldown_seconds
    polling_interval_in_seconds = var.polling_interval_seconds

    custom_scale_rule {
      name             = "cpu"
      custom_rule_type = "cpu"
      metadata = {
        type  = "Utilization"
        value = tostring(var.cpu_target_percent)
      }
    }

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
        name  = "DB_POOL_MAX"
        value = tostring(var.db_pool_max)
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }
      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }
      env {
        name  = "CACHE_ENABLED"
        value = tostring(var.cache_enabled)
      }
      env {
        name  = "CACHE_TTL_SECONDS"
        value = tostring(var.cache_ttl_seconds)
      }

      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/health"
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [
    azurerm_role_assignment.app_acr_pull,
    null_resource.bootstrap_image,
    azurerm_postgresql_flexible_server_database.atoms,
  ]
}