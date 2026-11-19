locals {
  acr_name = "${var.prefix}${random_string.suffix.result}"
  app_fqdn = azurerm_container_app.api.ingress[0].fqdn
}