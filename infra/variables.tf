variable "subscription_id" { type = string }

variable "location" {
  type    = string
  default = "swedencentral"
}

variable "prefix" {
  type    = string
  default = "atomsapi"
}

variable "alert_email" { type = string }

variable "github_repo" {
  type        = string
  description = "owner/repo (для довідки; сам довірчий зв'язок задається змінною github_oidc_subject)"
  default     = "RomanPorada/claude_lab"
}

variable "github_oidc_subject" {
  type        = string
  description = "Субʼєкт токена GitHub Actions (береться з логу кроку azure/login)"
  default     = "repo:RomanPorada@112850192/claude_lab@1430424668:ref:refs/heads/lab1"
}

variable "min_replicas" {
  type    = number
  default = 1
}

variable "max_replicas" {
  type    = number
  default = 4
}

variable "cpu_target_percent" {
  type        = number
  default     = 60
  description = "Цільове середнє завантаження CPU (% від ліміту контейнера), при перевищенні додаються екземпляри"
}

variable "cooldown_seconds" {
  type        = number
  default     = 300
  description = "Період стабілізації: скільки платформа чекає після спаду навантаження, перш ніж зменшувати кількість екземплярів"
}

variable "polling_interval_seconds" {
  type        = number
  default     = 30
  description = "Як часто перевіряється метрика масштабування"
}

variable "cache_enabled" {
  type        = bool
  default     = true
  description = "false вимикає кеш у застосунку (для порівняння без кешу / з кешем)"
}

variable "cache_ttl_seconds" {
  type    = number
  default = 45
}

variable "redis_version" {
  type    = string
  default = "7.4.1-alpine"
}

variable "db_pool_max" {
  type        = number
  default     = 6
  description = "Зʼєднань до БД на одну репліку. Реплік × db_pool_max має бути менше за max_connections БД"
}