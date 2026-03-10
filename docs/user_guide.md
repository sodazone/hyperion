# Hyperion Intelligence Console

The **Hyperion Intelligence Console** monitors cross-chain activity in the Polkadot ecosystem.

It allows users to:

- Monitor on-chain activity and asset flows
- Tag and track addresses
- Create automated monitoring rules
- Receive alerts through multiple channels

---

# Access

## Public Access

Some dashboards and monitoring views are available without login.

## Authenticated Access

Logged-in users can:

- Create monitoring rules
- Configure alert channels
- View private alerts
- Manage personal entities

## Early Access

The console is currently in **early access**. Accounts are limited and users are manually onboarded.

Initial access is focused on:

- Polkadot protocol teams
- Security teams
- Infrastructure providers
- Entities managing large on-chain volumes

To request access, contact the **SO/DA Zone team**.

## Login

Authentication uses **email magic links**.

**Login process**

1. Open the login page
2. Enter your email
3. Click the login link sent to your inbox

No password is required.

---

# Dashboard

The dashboard provides an overview of ecosystem activity, cross-chain solvency, and recent alerts.

Some sections are public. Others require login.

## Exchange Flows

Tracks transfers between wallets and centralized exchanges in USD.

Metrics:

- **Volume** — total value transferred during the selected period
- **Net Flow** — inflows minus outflows
- **Z-Score** — deviation from historical flow patterns

The chart shows flows over time.

The **Top Exchanges** table lists inflows, outflows, and net flow per exchange.

This section is public.

## Cross-Chain Reserves

Shows solvency data for bridged assets.

For each asset:

- **Reserve** — amount locked on the reserve chain
- **Remote** — amount issued on the destination chain
- **Delta** — difference between reserve and issued supply
- **Ratio** — reserve vs issued supply

A ratio close to **100%** indicates full backing.

The reserve address is also displayed.

This section is public.

## Latest Alerts

Displays recently generated alerts.

Alerts may include:

- **Public alerts** from platform monitoring
- **Private alerts** from rules configured in your account

Logged-in users see both in the same feed.

---

# Entities and Address Tagging

Addresses can be grouped into **entities** to add context to monitoring and alerts.

Entities are available in the right menu:

- **Public Entities**
- **My Entities**

Rules can reference **categories or tags**.  
For example, a rule can trigger when any address tagged `exchange_name:kraken` sends or receives funds. This allows monitoring groups of addresses without modifying rules when new wallets are added.

## Public Entities

Public entities are maintained by the platform.

Examples include:

- Exchanges
- Sanctioned entities
- Protocol treasuries
- Infrastructure providers
- Known ecosystem participants

These entities can be viewed and searched but cannot be modified.

## My Entities

**My Entities** are private to your account.

They can be used to:

- Track wallets
- Maintain watchlists
- Group related addresses
- Support monitoring rules

Users can create entities, assign categories, add addresses, add tags, and edit or delete entities.

## Categories

Each entity belongs to a **category**.

Categories are predefined to keep classification consistent.

Examples include:

- Cybercrime
- DeFi Protocol
- Exchange
- Infrastructure
- Services
- Sanctions

## Tags

Tags provide flexible labels for entities and are fully user-defined.

Common patterns include `name:binance`, `exchange_name:kraken`, or `team:treasury`.

Using consistent tags helps filter entities, build monitoring rules, and organize address lists.

---

# Alerting

## Alerts

An **alert** is generated when a monitoring rule detects a significant on-chain event.

Alerts can be delivered through channels such as:

- Discord
- Telegram

All alerts are also available in the console under **Public Alerts** or **My Alerts**.

## Creating a Rule

1. Open **Rules**
2. Click **Add Rule**
3. Select a rule template
4. Configure the parameters
5. Click **Save**

The monitoring system automatically begins evaluating the rule.

## Channels

Channels define where alerts are delivered.

Channels are configured in the **Channels** section. Users can create, edit, or delete channels and then attach them to monitoring rules.

A **test action** can send a sample alert to verify the configuration.

---

# Rule Templates

Hyperion provides several built-in monitoring templates.

| Template | ID | Description |
|---|---|---|
| Asset Movement | `transfer` | Detect large transfers using thresholds, tags, and categories |
| Crosschain Invariant | `xc-invariant` | Detect divergence between reserve and issued supply |
| Watched Entities | `watched` | Monitor activity related to selected entities, filtered by category and tags |
| OpenGov Alerts | `opengov` | Monitor governance events |

---

# Crosschain Invariant Monitoring

The **Crosschain Invariant** rule monitors the relationship between assets locked on a reserve chain and assets issued on a remote chain.

An alert is triggered when the **log ratio between reserve and remote balances** exceeds configured thresholds.

## How It Works

For each monitored asset the system compares:

- **Reserve balance** — assets locked on the reserve chain  
- **Remote balance** — assets issued on the destination chain  

The monitor evaluates the **log ratio between the two balances**. Under normal conditions this value remains close to zero, meaning the balances are near **1:1**.

If the deviation persists across several observations, an alert is generated.

Using the log ratio allows the system to measure **relative deviations symmetrically**, regardless of whether the reserve is higher or lower than the issued supply.

## Configuration

**Subscription**  
Bridge route to monitor (reserve → remote)

**Assets (optional)**  
Limit monitoring to specific assets. If empty, all assets are monitored.

**Noise Tolerance (`kSlack`)**  
Default `0.002`

**Alert Threshold (`hThreshold`)**  
Default `0.02`

**Minimum Consecutive Deficit (`minConsecutive`)**  
Default `3`

**Maximum Step**  
Limits large single deviations to reduce noise.

--- 

Happy monitoring!
