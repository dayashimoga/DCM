# Redis Multi-AZ Cluster for Leases & Distributed Locks

resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_parameter_group" "redis_params" {
  name   = "${var.environment}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }
}

resource "aws_elasticache_replication_group" "redis_cluster" {
  replication_group_id          = "${var.environment}-compute-redis"
  description                   = "High availability Redis cluster for heartbeats and locks"
  node_type                     = var.redis_node_type
  num_cache_clusters            = var.redis_num_nodes
  port                          = 6379
  parameter_group_name          = aws_elasticache_parameter_group.redis_params.name
  subnet_group_name             = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids            = [aws_security_group.redis_sg.id]
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  apply_immediately             = false
  maintenance_window            = "Sun:05:30-Sun:06:30"
  snapshot_retention_limit      = 7
  snapshot_window               = "02:00-03:00"

  tags = {
    Name = "${var.environment}-redis-cluster"
  }
}
