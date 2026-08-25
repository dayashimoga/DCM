# Managed PostgreSQL Cluster with Read Replica & Automated Backups

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.environment}-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres_primary" {
  identifier                  = "${var.environment}-postgres-primary"
  engine                      = "postgres"
  engine_version              = "16.2"
  instance_class              = var.db_instance_class
  allocated_storage           = var.db_allocated_storage
  max_allocated_storage       = 1000
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = var.db_name
  username                    = var.db_username
  password                    = random_password.db_password.result
  db_subnet_group_name        = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids      = [aws_security_group.db_sg.id]
  multi_az                    = true
  backup_retention_period     = 30
  backup_window               = "03:00-04:00"
  maintenance_window          = "Sun:04:30-Sun:05:30"
  auto_minor_version_upgrade  = true
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.environment}-postgres-final-snapshot"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "${var.environment}-postgres-primary"
  }
}

resource "aws_db_instance" "postgres_replica" {
  identifier             = "${var.environment}-postgres-replica"
  replicate_source_db    = aws_db_instance.postgres_primary.identifier
  instance_class         = var.db_instance_class
  auto_minor_version_upgrade = true
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  storage_encrypted      = true
  skip_final_snapshot    = true

  tags = {
    Name = "${var.environment}-postgres-read-replica"
  }
}
