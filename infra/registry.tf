resource "azurerm_container_registry" "acr" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = false
}

resource "null_resource" "bootstrap_image" {
  triggers = { acr = azurerm_container_registry.acr.id }

  provisioner "local-exec" {
    command = "az acr login --name ${azurerm_container_registry.acr.name} && docker build --platform linux/amd64 -t ${azurerm_container_registry.acr.login_server}/api:bootstrap ${path.module}/.. && docker push ${azurerm_container_registry.acr.login_server}/api:bootstrap"
  }
}

resource "null_resource" "redis_image" {
  triggers = {
    acr     = azurerm_container_registry.acr.id
    version = var.redis_version
  }

  provisioner "local-exec" {
    command = "az acr login --name ${azurerm_container_registry.acr.name} && docker pull --platform linux/amd64 redis:${var.redis_version} && docker tag redis:${var.redis_version} ${azurerm_container_registry.acr.login_server}/redis:${var.redis_version} && docker push ${azurerm_container_registry.acr.login_server}/redis:${var.redis_version}"
  }
}