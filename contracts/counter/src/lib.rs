//! Counter Application - A simple Linera smart contract example
//!
//! This module defines the shared types used by both the contract and service.

use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ChainId, ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct CounterAbi;

impl ContractAbi for CounterAbi {
    type Operation = Operation;
    type Response = u64;
}

impl ServiceAbi for CounterAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Operations that can be submitted by users to modify the counter.
#[derive(Debug, Clone, Deserialize, Serialize, GraphQLMutationRoot)]
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
