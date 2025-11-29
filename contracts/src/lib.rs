//! Counter Application - A simple Linera smart contract example
//!
//! This module defines the shared types used by both the contract and service.

use async_graphql::SimpleObject;
use linera_sdk::{
    linera_base_types::ChainId,
    views::{RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

/// The application state stored on-chain.
/// Uses RegisterView to persist a single u64 counter value.
#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct Counter {
    pub value: RegisterView<u64>,
}

/// Operations that can be submitted by users to modify the counter.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Operation {
    /// Increment the counter by a specified amount
    Increment { amount: u64 },
    /// Decrement the counter by a specified amount
    Decrement { amount: u64 },
    /// Reset the counter to zero
    Reset,
    /// Sync the current counter value to another chain
    SyncTo { target_chain: ChainId },
}

/// Messages sent between chains for cross-chain operations.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Message {
    /// Sync the counter value to another chain
    SyncValue { value: u64 },
}

/// The Application Binary Interface (ABI) for the counter application.
pub struct CounterAbi;

impl linera_sdk::abi::ContractAbi for CounterAbi {
    type Operation = Operation;
    type Response = u64;
}

impl linera_sdk::abi::ServiceAbi for CounterAbi {
    type Query = async_graphql::Request;
    type QueryResponse = async_graphql::Response;
}
