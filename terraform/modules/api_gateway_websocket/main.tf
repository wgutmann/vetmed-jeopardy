resource "aws_apigatewayv2_api" "websocket_api" {
  name          = "vetmed-jeopardy-websocket"
  protocol_type = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$default"
}

resource "aws_apigatewayv2_integration" "websocket_integration" {
  api_id           = aws_apigatewayv2_api.websocket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.signaling_lambda_invoke_arn
}

resource "aws_apigatewayv2_integration" "room_management_integration" {
  api_id           = aws_apigatewayv2_api.websocket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.room_management_lambda_invoke_arn
}

resource "aws_apigatewayv2_integration" "gemini_generation_integration" {
  api_id           = aws_apigatewayv2_api.websocket_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.gemini_generation_lambda_invoke_arn
}

resource "aws_apigatewayv2_route" "sendmessage_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "sendmessage"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_integration.id}"
}

resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_integration.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_integration.id}"
}

resource "aws_apigatewayv2_route" "create_room_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "createroom"
  target    = "integrations/${aws_apigatewayv2_integration.room_management_integration.id}"
}

resource "aws_apigatewayv2_route" "generate_questions_route" {
  api_id    = aws_apigatewayv2_api.websocket_api.id
  route_key = "generatequestions"
  target    = "integrations/${aws_apigatewayv2_integration.gemini_generation_integration.id}"
}

resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.signaling_lambda_arn
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.websocket_api.execution_arn}/*/*"
}


