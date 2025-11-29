//! Counter Service - Handles read-only queries and mutations
//!
//! This is the service binary that provides GraphQL query and mutation handlers
//! for reading and modifying the application state.

#![cfg_attr(target_arch = "wasm32", no_main)]

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use counter::{Counter, CounterAbi, Operation};
use linera_sdk::{abi::WithServiceAbi, views::View, Service, ServiceRuntime};

pub struct CounterService {
    state: Arc<Counter>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(CounterService);

impl WithServiceAbi for CounterService {
    type Abi = CounterAbi;
}

impl Service for CounterService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = Counter::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CounterService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
                value: *self.state.value.get(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

/// GraphQL query root for reading counter state
struct QueryRoot {
    value: u64,
}

#[Object]
impl QueryRoot {
    /// Get the current counter value
    async fn value(&self) -> u64 {
        self.value
    }
}

/// GraphQL mutation root for modifying counter state
struct MutationRoot {
    runtime: Arc<ServiceRuntime<CounterService>>,
}

#[Object]
impl MutationRoot {
    /// Increment the counter by the specified value
    async fn increment(&self, value: u64) -> [u8; 0] {
        self.runtime
            .schedule_operation(&Operation::Increment { amount: value });
        []
    }

    /// Decrement the counter by the specified value
    async fn decrement(&self, value: u64) -> [u8; 0] {
        self.runtime
            .schedule_operation(&Operation::Decrement { amount: value });
        []
    }

    /// Reset the counter to zero
    async fn reset(&self) -> [u8; 0] {
        self.runtime.schedule_operation(&Operation::Reset);
        []
    }

    /// Sync the current counter value to another chain
    async fn sync_to(&self, target_chain: String) -> [u8; 0] {
        let chain_id = target_chain.parse().expect("Invalid chain ID");
        self.runtime
            .schedule_operation(&Operation::SyncTo { target_chain: chain_id });
        []
    }
}
