#![no_std]

use soroban_sdk::{Address, Env, String, Vec, Map, I128, U64};

#[soroban_sdk::contract]
pub struct UsageAnalytics;

// Data structures for analytics
#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct UsageEvent {
    pub event_type: String,
    pub user_hash: String,  // Privacy-protected user identifier
    pub timestamp: U64,
    pub contract_address: Address,
    pub gas_used: U64,
    pub event_data: Map<String, String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct EngagementMetrics {
    pub active_users: U64,
    pub daily_active_users: U64,
    pub weekly_active_users: U64,
    pub monthly_active_users: U64,
    pub total_transactions: U64,
    pub avg_gas_per_tx: U64,
    pub retention_rate: I128, // basis points (10000 = 100%)
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct PerformanceIndicator {
    pub contract_name: String,
    pub avg_execution_time: U64,
    pub success_rate: I128, // basis points
    pub error_rate: I128, // basis points
    pub gas_efficiency: I128, // basis points
    pub uptime: I128, // basis points
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[soroban_sdk::contracttype]
pub struct AggregatedStats {
    pub period: String, // "daily", "weekly", "monthly"
    pub timestamp: U64,
    pub total_events: U64,
    pub unique_users: U64,
    pub total_gas: U64,
    pub top_contracts: Vec<String>,
    pub engagement: EngagementMetrics,
    pub performance: PerformanceIndicator,
}

// Storage keys
const ADMIN_KEY: u32 = 0;
const EVENT_COUNT_KEY: u32 = 1;
const USER_ACTIVITY_KEY: u32 = 2;
const DAILY_STATS_KEY: u32 = 3;
const WEEKLY_STATS_KEY: u32 = 4;
const MONTHLY_STATS_KEY: u32 = 5;
const PRIVACY_SETTINGS_KEY: u32 = 6;
const EVENT_BASE_KEY: u32 = 1000;
const USER_BASE_KEY: u32 = 5000;
const CONTRACT_BASE_KEY: u32 = 10000;

impl UsageAnalytics {
    /// Initialize the analytics contract
    pub fn initialize(e: Env, admin: Address, privacy_enabled: bool) {
        // Store admin
        e.storage().instance().set(&ADMIN_KEY, &admin);
        
        // Initialize counters
        e.storage().instance().set(&EVENT_COUNT_KEY, &0u64);
        e.storage().instance().set(&USER_ACTIVITY_KEY, &Map::<String, U64>::new(&e));
        
        // Initialize stats storage
        e.storage().instance().set(&DAILY_STATS_KEY, &Vec::<AggregatedStats>::new(&e));
        e.storage().instance().set(&WEEKLY_STATS_KEY, &Vec::<AggregatedStats>::new(&e));
        e.storage().instance().set(&MONTHLY_STATS_KEY, &Vec::<AggregatedStats>::new(&e));
        
        // Set privacy settings
        e.storage().instance().set(&PRIVACY_SETTINGS_KEY, &privacy_enabled);
    }

    /// Record a usage event with privacy protection
    pub fn record_event(e: Env, event_type: String, user: Address, contract_address: Address, 
                       gas_used: U64, event_data: Map<String, String>) -> U64 {
        // Get privacy settings
        let privacy_enabled: bool = e.storage().instance().get(&PRIVACY_SETTINGS_KEY).unwrap_or(true);
        
        // Create privacy-protected user hash if privacy is enabled
        let user_hash = if privacy_enabled {
            Self::hash_user_address(&e, &user)
        } else {
            String::from_str(&e, &user.to_string())
        };
        
        // Get current event count
        let event_count: U64 = e.storage().instance().get(&EVENT_COUNT_KEY).unwrap_or(0);
        let new_event_id = event_count + 1;
        
        // Create usage event
        let usage_event = UsageEvent {
            event_type: event_type.clone(),
            user_hash: user_hash.clone(),
            timestamp: e.ledger().timestamp(),
            contract_address: contract_address.clone(),
            gas_used,
            event_data: event_data.clone(),
        };
        
        // Store event
        let event_key = EVENT_BASE_KEY + new_event_id;
        e.storage().instance().set(&event_key, &usage_event);
        
        // Update event count
        e.storage().instance().set(&EVENT_COUNT_KEY, &new_event_id);
        
        // Update user activity
        Self::update_user_activity(&e, user_hash, contract_address);
        
        // Update contract metrics
        Self::update_contract_metrics(&e, contract_address, gas_used);
        
        new_event_id
    }

    /// Get engagement metrics for a given period
    pub fn get_engagement_metrics(e: Env, period: String) -> EngagementMetrics {
        let stats_key = match period.to_string().to_str(&e) {
            "daily" => DAILY_STATS_KEY,
            "weekly" => WEEKLY_STATS_KEY,
            "monthly" => MONTHLY_STATS_KEY,
            _ => panic!("Invalid period. Use 'daily', 'weekly', or 'monthly'"),
        };
        
        let stats: Vec<AggregatedStats> = e.storage().instance().get(&stats_key).unwrap_or(Vec::new(&e));
        
        if stats.is_empty() {
            return EngagementMetrics {
                active_users: 0,
                daily_active_users: 0,
                weekly_active_users: 0,
                monthly_active_users: 0,
                total_transactions: 0,
                avg_gas_per_tx: 0,
                retention_rate: 0,
            };
        }
        
        // Get the latest stats
        let latest_stats = stats.last().unwrap();
        latest_stats.engagement.clone()
    }

    /// Get performance indicators for a contract
    pub fn get_performance_indicators(e: Env, contract_address: Address) -> PerformanceIndicator {
        let contract_key = CONTRACT_BASE_KEY + Self::address_to_u64(&contract_address);
        let perf: Option<PerformanceIndicator> = e.storage().instance().get(&contract_key);
        
        perf.unwrap_or(PerformanceIndicator {
            contract_name: String::from_str(&e, "Unknown"),
            avg_execution_time: 0,
            success_rate: 0,
            error_rate: 0,
            gas_efficiency: 0,
            uptime: 0,
        })
    }

    /// Generate analytics report for a specific period
    pub fn generate_report(e: Env, period: String, start_time: U64, end_time: U64) -> AggregatedStats {
        let event_count: U64 = e.storage().instance().get(&EVENT_COUNT_KEY).unwrap_or(0);
        
        if event_count == 0 {
            panic!("No events recorded yet");
        }
        
        // Calculate aggregated statistics
        let mut total_gas = 0u64;
        let mut unique_users = 0u64;
        let mut contract_usage = Map::<String, U64>::new(&e);
        let mut user_set = Vec::<String>::new(&e);
        
        // Process events in the time range (simplified - in production would use more efficient indexing)
        for i in 1..=event_count {
            let event_key = EVENT_BASE_KEY + i;
            if let Some(event) = e.storage().instance().get::<_, UsageEvent>(&event_key) {
                if event.timestamp >= start_time && event.timestamp <= end_time {
                    total_gas += event.gas_used;
                    
                    // Track unique users
                    if !user_set.contains(&event.user_hash) {
                        user_set.push_back(event.user_hash.clone());
                        unique_users += 1;
                    }
                    
                    // Track contract usage
                    let contract_str = event.contract_address.to_string();
                    let current_count = contract_usage.get(contract_str.clone()).unwrap_or(0);
                    contract_usage.set(contract_str, current_count + 1);
                }
            }
        }
        
        // Get top contracts
        let mut top_contracts = Vec::<String>::new(&e);
        for (contract, _count) in contract_usage.iter() {
            top_contracts.push_back(contract);
        }
        
        // Create engagement metrics
        let engagement = EngagementMetrics {
            active_users: unique_users,
            daily_active_users: unique_users, // Simplified
            weekly_active_users: unique_users, // Simplified
            monthly_active_users: unique_users, // Simplified
            total_transactions: event_count,
            avg_gas_per_tx: if event_count > 0 { total_gas / event_count } else { 0 },
            retention_rate: 7500, // 75% placeholder
        };
        
        // Create performance indicator
        let performance = PerformanceIndicator {
            contract_name: String::from_str(&e, "System"),
            avg_execution_time: 1000, // 1s placeholder
            success_rate: 9500, // 95% placeholder
            error_rate: 500, // 5% placeholder
            gas_efficiency: 8000, // 80% placeholder
            uptime: 9900, // 99% placeholder
        };
        
        AggregatedStats {
            period,
            timestamp: e.ledger().timestamp(),
            total_events: event_count,
            unique_users,
            total_gas,
            top_contracts,
            engagement,
            performance,
        }
    }

    /// Get optimization suggestions based on usage patterns
    pub fn get_optimization_suggestions(e: Env) -> Vec<String> {
        let mut suggestions = Vec::<String>::new(&e);
        
        let event_count: U64 = e.storage().instance().get(&EVENT_COUNT_KEY).unwrap_or(0);
        
        if event_count == 0 {
            suggestions.push_back(String::from_str(&e, "Start tracking usage events to get optimization suggestions"));
            return suggestions;
        }
        
        // Analyze gas usage patterns
        let mut total_gas = 0u64;
        let mut high_gas_events = 0u64;
        
        for i in 1..=event_count {
            let event_key = EVENT_BASE_KEY + i;
            if let Some(event) = e.storage().instance().get::<_, UsageEvent>(&event_key) {
                total_gas += event.gas_used;
                if event.gas_used > 100000 { // High gas threshold
                    high_gas_events += 1;
                }
            }
        }
        
        let avg_gas = total_gas / event_count;
        
        // Generate suggestions based on analysis
        if avg_gas > 50000 {
            suggestions.push_back(String::from_str(&e, "Consider optimizing contract logic to reduce average gas consumption"));
        }
        
        if high_gas_events > event_count / 10 {
            suggestions.push_back(String::from_str(&e, "Some transactions use excessive gas. Review and optimize high-usage functions"));
        }
        
        suggestions.push_back(String::from_str(&e, "Consider implementing batching for frequent operations"));
        suggestions.push_back(String::from_str(&e, "Review contract storage patterns for optimization opportunities"));
        
        suggestions
    }

    /// Update privacy settings
    pub fn update_privacy_settings(e: Env, privacy_enabled: bool) {
        let admin: Address = e.storage().instance().get(&ADMIN_KEY).unwrap();
        admin.require_auth();
        
        e.storage().instance().set(&PRIVACY_SETTINGS_KEY, &privacy_enabled);
    }

    /// Clear old analytics data (admin only)
    pub fn clear_old_data(e: Env, older_than: U64) {
        let admin: Address = e.storage().instance().get(&ADMIN_KEY).unwrap();
        admin.require_auth();
        
        let event_count: U64 = e.storage().instance().get(&EVENT_COUNT_KEY).unwrap_or(0);
        let cutoff_time = e.ledger().timestamp() - older_than;
        
        let mut new_count = 0u64;
        
        // Remove old events and reorganize remaining ones
        for i in 1..=event_count {
            let event_key = EVENT_BASE_KEY + i;
            if let Some(event) = e.storage().instance().get::<_, UsageEvent>(&event_key) {
                if event.timestamp >= cutoff_time {
                    new_count += 1;
                    let new_key = EVENT_BASE_KEY + new_count;
                    e.storage().instance().set(&new_key, &event);
                }
            }
        }
        
        e.storage().instance().set(&EVENT_COUNT_KEY, &new_count);
    }

    // Helper functions
    
    fn hash_user_address(e: &Env, user: &Address) -> String {
        // Simple hash implementation for privacy protection
        // In production, use a proper cryptographic hash
        let user_str = user.to_string();
        let hash = user_str.len() as u64; // Simplified hash
        String::from_str(e, &hash.to_string())
    }
    
    fn address_to_u64(address: &Address) -> u64 {
        // Convert address to numeric key for storage
        // This is a simplified implementation
        address.to_string().len() as u64
    }
    
    fn update_user_activity(e: &Env, user_hash: String, contract_address: Address) {
        let mut user_activity: Map<String, U64> = e.storage().instance().get(&USER_ACTIVITY_KEY).unwrap_or(Map::new(e));
        
        let current_count = user_activity.get(user_hash.clone()).unwrap_or(0);
        user_activity.set(user_hash, current_count + 1);
        
        e.storage().instance().set(&USER_ACTIVITY_KEY, &user_activity);
    }
    
    fn update_contract_metrics(e: &Env, contract_address: Address, gas_used: U64) {
        let contract_key = CONTRACT_BASE_KEY + Self::address_to_u64(&contract_address);
        let mut perf: PerformanceIndicator = e.storage().instance().get(&contract_key).unwrap_or(PerformanceIndicator {
            contract_name: String::from_str(e, "Unknown"),
            avg_execution_time: 0,
            success_rate: 10000, // 100%
            error_rate: 0,
            gas_efficiency: 0,
            uptime: 10000, // 100%
        });
        
        // Update gas efficiency (simplified calculation)
        if gas_used > 0 {
            perf.gas_efficiency = 10000 - (gas_used / 100); // Simplified efficiency calculation
        }
        
        e.storage().instance().set(&contract_key, &perf);
    }
}
