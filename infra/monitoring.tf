resource "azurerm_monitor_diagnostic_setting" "agw" {
  name                       = "agw-to-law"
  target_resource_id         = azurerm_application_gateway.agw.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id

  enabled_log {
    category = "ApplicationGatewayAccessLog"
  }
}

locals {
  metric_charts = [
    {
      title = "Екземпляри застосунку (Replicas)"
      metrics = [
        { name = "Replicas", agg = 3, label = "Макс. за хвилину" },
        { name = "Replicas", agg = 2, label = "Мін. за хвилину" },
      ]
    },
    {
      title = "Завантаження CPU, % від ліміту"
      metrics = [
        { name = "CpuPercentage", agg = 4, label = "Середнє" },
        { name = "CpuPercentage", agg = 3, label = "Максимум" },
      ]
    },
    {
      title   = "Запити за хвилину"
      metrics = [{ name = "Requests", agg = 1, label = "Запитів" }]
    },
    {
      title   = "Відповіді 5xx"
      metrics = [{ name = "Requests", agg = 1, label = "5xx" }]
      filters = [{ key = "statusCodeCategory", operator = 0, values = ["5xx"] }]
    },
  ]

  p95_query = <<-KQL
    AzureDiagnostics
    | where ResourceType == "APPLICATIONGATEWAYS" and Category == "ApplicationGatewayAccessLog"
    | summarize p95_ms = percentile(timeTaken_d, 95) * 1000 by bin(TimeGenerated, 1m)
    | render timechart
  KQL

  metric_parts = {
    for i, c in local.metric_charts : tostring(i) => {
      position = { x = (i % 2) * 6, y = floor(i / 2) * 4, colSpan = 6, rowSpan = 4 }
      metadata = {
        type = "Extension/HubsExtension/PartType/MonitorChartPart"
        inputs = [
          {
            name = "options"
            value = {
              chart = {
                metrics = [
                  for m in c.metrics : {
                    resourceMetadata    = { id = azurerm_container_app.api.id }
                    name                = m.name
                    aggregationType     = m.agg
                    namespace           = "microsoft.app/containerapps"
                    metricVisualization = { displayName = m.label }
                  }
                ]
                title            = c.title
                titleKind        = 2
                visualization    = { chartType = 2 }
                openBladeOnClick = { openBlade = true }
                filterCollection = { filters = try(c.filters, []) }
              }
            }
          },
          { name = "sharedTimeRange", isOptional = true },
        ]
        settings = {}
      }
    }
  }

  latency_part = {
    position = { x = 0, y = 8, colSpan = 6, rowSpan = 4 }
    metadata = {
      type = "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
      inputs = [
        { name = "resourceTypeMode", isOptional = true },
        { name = "ComponentId", isOptional = true },
        { name = "Scope", value = { resourceIds = [azurerm_log_analytics_workspace.logs.id] }, isOptional = true },
        { name = "PartId", isOptional = true },
        { name = "Version", value = "2.0", isOptional = true },
        { name = "TimeRange", value = "PT1H", isOptional = true },
        { name = "DashboardId", isOptional = true },
        { name = "DraftRequestParameters", value = { scope = "hierarchy" }, isOptional = true },
        { name = "Query", value = local.p95_query, isOptional = true },
        { name = "ControlType", value = "FrameControl", isOptional = true },
        { name = "SpecificChart", value = "Line", isOptional = true },
        { name = "PartTitle", value = "Латентність p95, мс (за журналами шлюзу)", isOptional = true },
        { name = "PartSubTitle", value = azurerm_log_analytics_workspace.logs.name, isOptional = true },
        {
          name = "Dimensions"
          value = {
            xAxis       = { name = "TimeGenerated", type = "datetime" }
            yAxis       = [{ name = "p95_ms", type = "real" }]
            splitBy     = []
            aggregation = "Sum"
          }
          isOptional = true
        },
        { name = "LegendOptions", value = { isEnabled = true, position = "Bottom" }, isOptional = true },
        { name = "IsQueryContainTimeRange", value = false, isOptional = true },
      ]
      settings = {}
    }
  }
}

resource "azurerm_portal_dashboard" "main" {
  name                = "dash-${var.prefix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = { "hidden-title" = "Atoms API: масштабування і моніторинг" }

  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = merge(local.metric_parts, { "4" = local.latency_part })
      }
    }
    metadata = {
      model = {
        timeRange = {
          type  = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
          value = { relative = { duration = 1, timeUnit = 1 } } # останній 1 година
        }
      }
    }
  })
}