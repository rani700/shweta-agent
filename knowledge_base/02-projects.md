# Projects (all personal, all shipped)

Shweta showcases live demos of her projects on her YouTube channel: https://youtube.com/@ShwetaNimesh — the channel is a project showcase, not tutorials.

## DietDoctor AI — WhatsApp Health Agent
- A personalized AI dietician that lives entirely inside WhatsApp — natural-language coaching, no app install.
- Built with Google ADK (Agent Development Kit) and Gemini 2.5 Flash; conversational agent with function-calling tools (BMI, BMR, macros) so deterministic Python handles the math, eliminating LLM arithmetic errors.
- Deployed as a containerized FastAPI service on Kubernetes with GitOps CI/CD; WhatsApp wiring via n8n.
- Code: https://github.com/rani700/DietDoctorAI
- Demo video (try it yourself): https://www.youtube.com/watch?v=LNHT23NMFGU

## EasyForm — AI Document Extraction Agent
- Auto-fills application forms from marksheets and ID documents using GPT-4o vision and a LangGraph state machine (classify → extract → validate → merge).
- Vision-based validation with fuzzy identity cross-referencing; automated email intake (IMAP/SMTP) with natural-language parsing that follows up on missing fields by itself.
- Stack: GPT-4o Vision, LangGraph, LangChain, FastAPI, PostgreSQL.
- Code: https://github.com/rani700/easyform

## HealthCompanion — Per-Patient Medical RAG
- A grounded RAG system that answers questions ONLY from each patient's own medical records.
- Gemini vision OCR reads scanned and handwritten documents; hybrid retrieval (semantic + keyword fused with RRF, then MMR re-ranking) over per-patient ChromaDB collections.
- Defense-in-depth patient isolation, role-based access control, JWT auth; every answer is source-cited and hallucination-resistant.
- Stack: Google Gemini, ChromaDB, FastAPI, React; Dockerized to Kubernetes with ArgoCD GitOps.
- Code: https://github.com/rani700/healthcompanion
- Live demo: https://healthcompanion.codeshare.co.in

## Agentic AI Data Platform — natural language to Spark SQL
- An autonomous agent using Llama 3.3 for natural-language data querying over Databricks.
- Implements the ReAct pattern to autonomously generate and execute Spark SQL transformations over a Medallion (bronze/silver/gold) architecture.
- Stack: Databricks, Llama 3.3, Streamlit, Spark SQL, Python.
- Code: https://github.com/rani700/Databricks_Ecomm_Data_Platform
- Build walkthrough video: https://www.youtube.com/watch?v=as7wht24yj4

## Real-time Data Streaming Pipeline
- End-to-end streaming architecture: EC2 → Apache NiFi → S3 → SnowPipe → Snowflake, with change-data-capture via Snowflake streams and tasks.
- Containerized with Docker Compose for consistent, scalable deployment.
- Stack: Apache NiFi, AWS, Snowflake, SnowPipe, Docker.
- Code: https://github.com/rani700/RealTime-Data-Streaming-using-Apache-Nifi-AWS-and-Snowflake
- Demo video: https://www.youtube.com/watch?v=wH_MlgZoMhA

## Automated Web Scraper (YouTube build)
- Built an automated web scraper with Playwright and Docker in one hour, wired to Azure with CI/CD via GitHub Actions.
- Video: https://www.youtube.com/watch?v=-Yt0q1qD_Tw

## Beyond the flagships — her wider GitHub

Shweta's GitHub (https://github.com/rani700) shows years of applied machine-learning engineering from BEFORE the LLM era — she was training neural networks long before agents were fashionable. Highlights worth mentioning when visitors ask about her ML, computer-vision or classical data-science depth:

- **xray** — lung-field segmentation on chest X-ray images with deep learning; her most-starred repo. https://github.com/rani700/xray
- **molecules_classification** — musk vs non-musk and 102-class molecule classification comparing DNNs, CNNs and transfer learning. https://github.com/rani700/molecules_classification
- **corona** — COVID fatalities prediction with time-series forecasting. https://github.com/rani700/corona
- **Azure real-time news analysis** — automated pipeline with Azure Data Factory, Python Azure Functions, Azure AI Language and Azure SQL, visualized in Metabase. https://github.com/rani700/Azure-Data-Engineering-Project-Real-time-News-Analysis-with-AI-Metabase
- **SpotifyData-ETL-Pipeline** — ETL pipeline over Spotify data. https://github.com/rani700/SpotifyData-ETL-Pipeline
- **recommendation-system**, **sentiment-analysis**, **delhi-weather-prediction**, **car-models-classification** — classical ML: recommenders, NLP sentiment, forecasting, image classification. All at https://github.com/rani700
- **serverless-chat** — peer-to-peer serverless chat in TypeScript. https://github.com/rani700/serverless-chat

The arc to tell: computer vision and classical ML → production data engineering → LLM agents and RAG. Her GenAI work stands on real ML and data foundations.
