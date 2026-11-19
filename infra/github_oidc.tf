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
  subject             = var.github_oidc_subject
}

resource "azurerm_federated_identity_credential" "gh_lab2" {
  name                = "github-lab2"
  resource_group_name = azurerm_resource_group.rg.name
  parent_id           = azurerm_user_assigned_identity.gh.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = replace(var.github_oidc_subject, "refs/heads/lab1", "refs/heads/lab2")

  # Azure не дозволяє створювати кілька довірчих записів однієї ідентичності одночасно
  depends_on = [azurerm_federated_identity_credential.gh_main]
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
