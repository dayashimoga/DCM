variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (prod, staging, dev)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL instance size"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for PostgreSQL"
  type        = number
  default     = 200
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "distributed_compute_prod"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "compute_admin"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_nodes" {
  description = "Number of Redis replica nodes"
  type        = number
  default     = 3
}
