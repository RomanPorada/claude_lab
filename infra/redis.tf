resource "azurerm_container_app" "redis" {
  name                         = "ca-${var.prefix}-redis"
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
    name  = "redis-password"
    value = random_password.redis.result
  }

  ingress {
    external_enabled = false
    transport        = "tcp"
    target_port      = 6379
    exposed_port     = 6379

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "redis"
      image  = "${azurerm_container_registry.acr.login_server}/redis:${var.redis_version}"
      cpu    = 0.25
      memory = "0.5Gi"

      command = ["/bin/sh", "-c"]
      # Без збереження на диск (це кеш) і з обмеженням памʼяті; старі ключі витісняються (LRU)
      args = ["exec redis-server --requirepass \"$REDIS_PASSWORD\" --save '' --appendonly no --maxmemory 100mb --maxmemory-policy allkeys-lru"]

      env {
        name        = "REDIS_PASSWORD"
        secret_name = "redis-password"
      }
    }
  }

  depends_on = [azurerm_role_assignment.app_acr_pull, null_resource.redis_image]
}
