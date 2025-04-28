// zk-sampler/api/src/main.rs
use axum::{
    routing::{get, post},
    Router,
    http::Method,
};
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::{CorsLayer, Any};
use tracing::info;
use tracing_subscriber;
use sp1_sdk::HashableKey;

mod handlers;
mod types;
mod utils;

use types::AppState;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("debug")
        .init();

    info!("🌀 Starting zkSampler API...");
    dotenv::dotenv().ok();

    let elf_data = utils::load_elf("zk-sampler-program");
    let prover = sp1_sdk::ProverClient::from_env();
    let (pk, vk) = prover.setup(&elf_data);

    let state = AppState {
        prover: Arc::new(prover),
        elf_data: Arc::new(elf_data),
        pk: Arc::new(pk),
        vk: vk.bytes32(),
    };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/prove-local", get(handlers::prove_local))
        .route("/prove", post(handlers::generate_proof))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("🚀 Server running on http://{}", addr);
    axum::serve(listener, app).await.unwrap();
}