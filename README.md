# Hyperion

Hyperion is a blockchain intelligence platform for monitoring, analytics, and alerting across cryptocurrency networks.

## Overview

Hyperion aggregates blockchain intelligence from multiple sources, processes it for analysis, monitors network activity in real time, and triggers alerts based on user-defined rules. Data is available through HTTP APIs and a web console.

## Architecture

Hyperion consists of the following components:

- **Data Ingestion Layer**: Streams blockchain data from Ocelloids and external intelligence providers  
- **Processing Engine**: Indexes, queries, and maintains an intelligence database of entities and addresses  
- **Monitoring System**: Evaluates activity against rules and sends alerts through configurable channels  
- **Storage Layer**: OLAP and OLTP databases for structured data and metadata  
- **API Layer**: Versioned REST endpoints for public and private access  
- **Web Interface**: Console for dashboards, alert management, and entity tracking  

## Key Features

- **Multi-chain Support**: Cross-network data collection and analysis  
- **Continuous Monitoring**: Ongoing activity evaluation and alerting  
- **Entity Tracking**: Address and category monitoring with custom rules  
- **Alert Configuration**: Flexible rules and notification channels  
- **Analytics Dashboard**: Insights into exchange flows and network activity  
- **Authentication**: JWT-based access with Stytch multi-tenant integration  
- **Access Control**: Isolated namespaces for different data tiers
