output "vpc_id" {
  description = "VPC ID for cluster deployments"
  value       = aws_vpc.main.id
}

output "postgres_primary_endpoint" {
  description = "PostgreSQL Primary Connection Endpoint"
  value       = aws_db_instance.postgres_primary.endpoint
}

output "postgres_read_replica_endpoint" {
  description = "PostgreSQL Read Replica Connection Endpoint"
  value       = aws_db_instance.postgres_replica.endpoint
}

output "redis_primary_endpoint" {
  description = "Redis Replication Group Primary Endpoint"
  value       = aws_elasticache_replication_group.redis_cluster.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis Replication Group Reader Endpoint"
  value       = aws_elasticache_replication_group.redis_cluster.reader_endpoint_address
}
