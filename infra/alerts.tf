resource "azurerm_monitor_action_group" "email" {
  name                = "ag-${var.prefix}"
  resource_group_name = azurerm_resource_group.rg.name
  short_name          = "atomsapi"

  email_receiver {
    name          = "owner"
    email_address = var.alert_email
  }
}

resource "azurerm_monitor_metric_alert" "max_replicas" {
  name                = "alert-max-replicas"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_container_app.api.id]
  description         = "Автомасштабування вичерпало запас: досягнуто максимальної кількості екземплярів"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  auto_mitigate       = true

  criteria {
    metric_namespace = "Microsoft.App/containerapps"
    metric_name      = "Replicas"
    aggregation      = "Maximum"
    operator         = "GreaterThanOrEqual"
    threshold        = var.max_replicas
  }

  action {
    action_group_id = azurerm_monitor_action_group.email.id
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
