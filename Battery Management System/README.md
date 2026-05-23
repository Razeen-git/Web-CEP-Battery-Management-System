Battery Management System (BMS) Dashboard
A full-stack web dashboard for battery monitoring, state-of-health (SOH) classification, location finding, and wallet demo features. Built with React + Vite (frontend) and Python FastAPI (MQTT + ML backend).

Live ML demo (Hugging Face): https://huggingface.co/spaces/abdulmoeez380/battery-classifier

Features
Module	Description
Map
Find nearest charge points (OpenStreetMap dark map, or Google Maps if API key is set)
Battery Status
Device/browser battery metrics
Battery Health SOH
Cloud ML classifier (Hugging Face) + optional live MQTT stream with on-device models
Wallet
Demo wallet and transaction UI
Tech stack
Frontend: React 19, Vite, React Router, Recharts, Leaflet
Backend: Python, FastAPI, WebSockets, Paho MQTT
ML: scikit-learn (Random Forest, Gradient Boosting, Extra Trees)
IoT: ESP32 → HiveMQ Cloud → Python API
Quick start
Requirements
Node.js 18+
Python 3.10+
(Optional) Google Maps API key
(Optional) ESP32 + HiveMQ for live MQTT data
