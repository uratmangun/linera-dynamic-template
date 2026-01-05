//! Counter Application State
//!
//! This module defines the application state stored on-chain.

use linera_sdk::views::{linera_views, RegisterView, RootView, ViewStorageContext};

/// The application state stored on-chain.
/// Uses RegisterView to persist a single u64 counter value.
#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct CounterState {
    pub value: RegisterView<u64>,
}
