//! Counter Contract - Handles state modifications
//!
//! This is the contract binary that processes operations and messages,
//! modifying the on-chain state.

#![cfg_attr(target_arch = "wasm32", no_main)]

use counter::{Counter, CounterAbi, Message, Operation};
use linera_sdk::{abi::WithContractAbi, views::{RootView, View}, Contract, ContractRuntime};

pub struct CounterContract {
    state: Counter,
    #[allow(dead_code)]
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(CounterContract);

impl WithContractAbi for CounterContract {
    type Abi = CounterAbi;
}

impl Contract for CounterContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = u64;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = Counter::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CounterContract { state, runtime }
    }

    async fn instantiate(&mut self, initial_value: u64) {
        self.state.value.set(initial_value);
    }

    async fn execute_operation(&mut self, operation: Operation) -> u64 {
        match operation {
            Operation::Increment { amount } => {
                let current = *self.state.value.get();
                let new_value = current.saturating_add(amount);
                self.state.value.set(new_value);
                new_value
            }
            Operation::Decrement { amount } => {
                let current = *self.state.value.get();
                let new_value = current.saturating_sub(amount);
                self.state.value.set(new_value);
                new_value
            }
            Operation::Reset => {
                self.state.value.set(0);
                0
            }
            Operation::SyncTo { target_chain } => {
                let current = *self.state.value.get();
                self.runtime
                    .prepare_message(Message::SyncValue { value: current })
                    .send_to(target_chain);
                current
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::SyncValue { value } => {
                self.state.value.set(value);
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
