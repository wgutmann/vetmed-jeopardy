variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "service_name" {
  description = "Name for the App Runner service"
  type        = string
  default     = "vetmed-orchestrator"
}

variable "container_image" {
  description = "ECR image URI to deploy"
  type        = string
}

variable "signal_jwt_secret" {
  description = "Secret value for JWT signing"
  type        = string
  sensitive   = true
}
