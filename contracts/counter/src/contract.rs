//! Counter Contract - Handles state modifications
//!
//! This is the contract binary that processes operations and messages,
//! modifying the on-chain state.

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};

use counter::{Message, Operation};

use self::state::CounterState;

pub struct CounterContract {
    state: CounterState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(CounterContract);

impl WithContractAbi for CounterContract {
    type Abi = counter::CounterAbi;
}

impl Contract for CounterContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = u64;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = CounterState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CounterContract { state, runtime }
    }

    async fn instantiate(&mut self, initial_value: Self::InstantiationArgument) {
        self.state.value.set(initial_value);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
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

    async fn execute_message(&mut self, message: Self::Message) {
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

#[cfg(test)]
mod tests {
    use futures::FutureExt as _;
    use linera_sdk::{util::BlockingWait, views::View, Contract, ContractRuntime};

    use counter::Operation;

    use super::{CounterContract, CounterState};

    #[test]
    fn increment_operation() {
        let initial_value = 10u64;
        let mut app = create_and_instantiate_app(initial_value);

        let increment = 10u64;

        let response = app
            .execute_operation(Operation::Increment { amount: increment })
            .now_or_never()
            .expect("Execution of application operation should not await anything");

        assert_eq!(response, initial_value + increment);
        assert_eq!(*app.state.value.get(), initial_value + increment);
    }

    #[test]
    fn decrement_operation() {
        let initial_value = 10u64;
        let mut app = create_and_instantiate_app(initial_value);

        let decrement = 3u64;

        let response = app
            .execute_operation(Operation::Decrement { amount: decrement })
            .now_or_never()
            .expect("Execution of application operation should not await anything");

        assert_eq!(response, initial_value - decrement);
        assert_eq!(*app.state.value.get(), initial_value - decrement);
    }

    #[test]
    fn reset_operation() {
        let initial_value = 10u64;
        let mut app = create_and_instantiate_app(initial_value);

        let response = app
            .execute_operation(Operation::Reset)
            .now_or_never()
            .expect("Execution of application operation should not await anything");

        assert_eq!(response, 0);
        assert_eq!(*app.state.value.get(), 0);
    }

    fn create_and_instantiate_app(initial_value: u64) -> CounterContract {
        let runtime = ContractRuntime::new().with_application_parameters(());
        let mut contract = CounterContract {
            state: CounterState::load(runtime.root_view_storage_context())
                .blocking_wait()
                .expect("Failed to read from mock key value store"),
            runtime,
        };

        contract
            .instantiate(initial_value)
            .now_or_never()
            .expect("Initialization of application state should not await anything");

        assert_eq!(*contract.state.value.get(), initial_value);

        contract
    }
}
