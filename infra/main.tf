resource "aws_ecr_repository" "orchestrator" {
  name                 = var.service_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_secretsmanager_secret" "jwt" {
  name = "${var.service_name}-jwt"
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = var.signal_jwt_secret
}

resource "aws_iam_role" "apprunner" {
  name               = "${var.service_name}-role"
  assume_role_policy = data.aws_iam_policy_document.apprunner_assume.json
}

resource "aws_iam_role" "apprunner_runtime" {
  name               = "${var.service_name}-runtime"
  assume_role_policy = data.aws_iam_policy_document.apprunner_assume.json
}

data "aws_iam_policy_document" "apprunner_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com", "tasks.apprunner.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

resource "aws_iam_role_policy" "runtime_secrets" {
  name = "${var.service_name}-runtime-secrets"
  role = aws_iam_role.apprunner_runtime.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.jwt.arn
      }
    ]
  })
}

resource "aws_apprunner_service" "orchestrator" {
  service_name = var.service_name

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner.arn
    }

    image_repository {
      image_identifier      = var.container_image
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          NODE_ENV            = "production"
          ROOM_TTL_MS         = tostring(60 * 60 * 1000)
          CLEANUP_INTERVAL_MS = tostring(5 * 60 * 1000)
        }
        runtime_environment_secrets = {
          SIGNALING_JWT_SECRET = aws_secretsmanager_secret.jwt.arn
        }
      }
    }
  }

  instance_configuration {
    instance_role_arn = aws_iam_role.apprunner_runtime.arn
  }

  health_check_configuration {
    protocol = "HTTP"
    path     = "/healthz"
  }
}
