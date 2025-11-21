resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda_gemini_generation_exec_role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/src"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "gemini_generation_lambda" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "vetmed-jeopardy-gemini-generation"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  environment {
    variables = {
      GEMINI_API_KEY = "YOUR_GEMINI_API_KEY" // This should be stored securely
    }
  }
}
