terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "api_gateway_websocket" {
  source = "./modules/api_gateway_websocket"
  signaling_lambda_invoke_arn = module.lambda_signaling.signaling_lambda_invoke_arn
  signaling_lambda_arn        = module.lambda_signaling.signaling_lambda_arn
  room_management_lambda_invoke_arn = module.lambda_room_management.room_management_lambda_invoke_arn
  gemini_generation_lambda_invoke_arn = module.lambda_gemini_generation.gemini_generation_lambda_invoke_arn
}

module "lambda_signaling" {
  source = "./modules/lambda_signaling"
  websocket_api_endpoint = module.api_gateway_websocket.websocket_api_endpoint
}

module "lambda_room_management" {
  source = "./modules/lambda_room_management"
}

module "lambda_gemini_generation" {
  source = "./modules/lambda_gemini_generation"
}
