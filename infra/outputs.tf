output "public_url" { value = "http://${azurerm_public_ip.agw.fqdn}" }
output "acr_name" { value = azurerm_container_registry.acr.name }
output "acr_login_server" { value = azurerm_container_registry.acr.login_server }
output "resource_group" { value = azurerm_resource_group.rg.name }
output "container_app" { value = azurerm_container_app.api.name }
output "redis_app" { value = azurerm_container_app.redis.name }
output "github_client_id" { value = azurerm_user_assigned_identity.gh.client_id }
output "tenant_id" { value = azurerm_user_assigned_identity.gh.tenant_id }
output "db_host" { value = azurerm_postgresql_flexible_server.db.fqdn }
output "dashboard_name" { value = azurerm_portal_dashboard.main.name }

output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
