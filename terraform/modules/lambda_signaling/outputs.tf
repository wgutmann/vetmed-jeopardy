output "signaling_lambda_arn" {
  value = aws_lambda_function.signaling_lambda.arn
}

output "signaling_lambda_invoke_arn" {
  value = aws_lambda_function.signaling_lambda.invoke_arn
}
