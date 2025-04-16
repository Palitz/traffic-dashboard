# Deployment Monitoring Script
$region = "ap-south-1"
$cluster = "traffic-dashboard-cluster"
$service = "traffic-dashboard-service"

Write-Host "=== Deployment Monitoring ==="
Write-Host "Timestamp: $(Get-Date)"

# Check ECS Service Status
Write-Host "`n=== ECS Service Status ==="
aws ecs describe-services --cluster $cluster --services $service --region $region

# Check Running Tasks
Write-Host "`n=== Running Tasks ==="
aws ecs list-tasks --cluster $cluster --region $region

# Check CloudWatch Logs
Write-Host "`n=== Recent Logs ==="
aws logs describe-log-streams --log-group-name "/ecs/traffic-dashboard" --region $region

# Check ECR Repository
Write-Host "`n=== ECR Repository Status ==="
aws ecr describe-repositories --repository-names traffic-dashboard --region $region

# Check Task Definition
Write-Host "`n=== Task Definition Status ==="
aws ecs describe-task-definition --task-definition traffic-dashboard:1 --region $region

Write-Host "`n=== Monitoring Complete ===" 