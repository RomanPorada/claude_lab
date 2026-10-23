# Бонус 7: дашборд з базовими метриками (запити, 5xx, латентність, CPU, памʼять).
# Логи контейнера вже йдуть у Log Analytics (див. log_analytics_workspace_id у середовищі),
# алерт на 5xx з email — у main.tf.

locals {
  charts = [
    { title = "Запити (Application Gateway)", id = azurerm_application_gateway.agw.id, ns = "microsoft.network/applicationgateways", metric = "TotalRequests", agg = 1 },
    { title = "Помилки 5xx / failed requests", id = azurerm_application_gateway.agw.id, ns = "microsoft.network/applicationgateways", metric = "FailedRequests", agg = 1 },
    { title = "Латентність (Application Gateway, мс)", id = azurerm_application_gateway.agw.id, ns = "microsoft.network/applicationgateways", metric = "ApplicationGatewayTotalTime", agg = 4 },
    { title = "CPU застосунку (nanocores)", id = azurerm_container_app.api.id, ns = "microsoft.app/containerapps", metric = "UsageNanoCores", agg = 4 },
    { title = "Памʼять застосунку (байти)", id = azurerm_container_app.api.id, ns = "microsoft.app/containerapps", metric = "WorkingSetBytes", agg = 4 },
    { title = "Запити до Container App", id = azurerm_container_app.api.id, ns = "microsoft.app/containerapps", metric = "Requests", agg = 1 },
  ]
}

resource "azurerm_portal_dashboard" "main" {
  name                = "dash-${var.prefix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = { "hidden-title" = "Atoms API — моніторинг" }

  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          for i, c in local.charts : tostring(i) => {
            position = { x = (i % 2) * 6, y = floor(i / 2) * 4, colSpan = 6, rowSpan = 4 }
            metadata = {
              type = "Extension/HubsExtension/PartType/MonitorChartPart"
              inputs = [
                {
                  name = "options"
                  value = {
                    chart = {
                      metrics = [{
                        resourceMetadata    = { id = c.id }
                        name                = c.metric
                        aggregationType     = c.agg
                        namespace           = c.ns
                        metricVisualization = { displayName = c.title }
                      }]
                      title           = c.title
                      titleKind       = 2
                      visualization   = { chartType = 2 }
                      openBladeOnClick = { openBlade = true }
                    }
                  }
                },
                { name = "sharedTimeRange", isOptional = true }
              ]
              settings = {}
            }
          }
        }
      }
    }
    metadata = {
      model = {
        timeRange = {
          type  = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
          value = { relative = { duration = 24, timeUnit = 1 } }
        }
      }
    }
  })
}

output "dashboard_name" { value = azurerm_portal_dashboard.main.name }
