# 🎓 EduIntellect: AI-Powered Bursary & Payment System

[![Hackathon](https://img.shields.io/badge/Event-Enyata_x_Interswitch_Buildathon-blue?style=for-the-badge)](https://business.quickteller.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React_&_Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![AI](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)]()

**EduIntellect** is a next-generation school management and bursary portal designed to streamline tuition collection and automate parent communication using AI and secure payment gateways. Built specifically for the Enyata x Interswitch Buildathon.

---

## 🚀 Project Overview

Managing school fees, communicating outstanding debts to parents, and answering redundant policy questions are massive pain points for school administrators. EduIntellect solves this by combining a powerful admin dashboard with an AI-driven, conversational payment portal for parents.

Instead of navigating complex portals, parents simply log in to the portal using the **phone number they provided during their child's enrollment**. This opens a secure, personalized chat with the **Google Gemini-powered EduIntellect AI**. The Gemini model uses Retrieval-Augmented Generation (RAG) to answer questions based strictly on the school's specific uploaded policies, and generates **inline Interswitch payment cards** to clear tuition debts instantly without ever leaving the chat interface.

## ✨ Key Features

### For School Administrators
* **Bursary Dashboard:** Real-time metrics on total collected funds, active payment plans, and outstanding debts.
* **Direct Database Integration:** Automatically fetches student records and outstanding balances directly from the school's core database. 
* **Manual Roster Management:** A fallback system allowing bursars to manually input and add new students to the system if they haven't been fully synced from enrollment yet.
* **Gemini Knowledge Base (RAG):** Upload school policies, fee structures, and guidelines (PDF/Word). The system chunks and embeds these documents so the Gemini AI Assistant can answer parent queries accurately and contextually.
* **Dynamic Student Directory:** Filter students by class, monitor payment statuses (`Paid`, `Pending`, `Not Paid`), and manually approve offline payments.
* **Secure Configuration:** A dedicated settings environment to manage Interswitch Sandbox/Live credentials (`merchant_code`, `pay_item_id`) and toggle environments securely.

### For Parents (The Conversational Portal)
* **Phone Number Authentication:** A frictionless, secure login flow that uses the parent's registered phone number to pull up their specific child's billing context.
* **Mobile-First Gemini AI Chat:** A fluid, app-like chat interface powered by Google Gemini for natural, intelligent conversation.
* **Context-Aware Assistance:** The AI knows the student's specific outstanding balance and answers questions grounded in the school's uploaded policies.
* **Interswitch WebPay Inline:** When ready to pay, the AI generates a rich payment UI. Clicking "Pay" triggers the secure Interswitch modal directly over the chat, ensuring high conversion rates and zero context-switching.

---

## 📖 How to Use the App (Demo Guide)

To fully experience the EduIntellect platform, follow this two-part workflow representing the Bursar and the Parent.

### Part 1: The Admin/Bursar Flow
1. **Login & Setup:** Access the Admin Portal (`/login`) and authenticate. Navigate to the **Settings** page to input your Interswitch Sandbox Credentials (`merchant_code` and `pay_item_id`).
2. **Train the AI:** Navigate to the **Policies (RAG)** page. Upload a dummy school fee policy or code of conduct. The backend will parse this and feed it to the Gemini model's knowledge base.
3. **Manage Roster:** Go to the **Students** directory. View the list of enrolled students. Click **Add Student** to manually enroll a new student with an outstanding balance of ₦15,000 and the status "Not Paid".

### Part 2: The Parent Payment Flow
1. **Parent Login:** Navigate to the Parent Portal (`/parent-login`). Enter the registered phone number of the student you just created.
2. **Chat with Gemini:** Ask the AI a question about the school policies (e.g., "What happens if I pay late?") to see the RAG implementation in action. 
3. **Initiate Payment:** Ask the AI, "How much do I owe?" or "I want to pay." Gemini will generate a rich Interswitch Payment Card in the chat.
4. **Checkout:** Click **Pay Securely via Interswitch**. Use an Interswitch Test Card in the WebPay modal to complete the transaction.
5. **Real-Time Verification:** Once successful, the chat will display a success receipt. If you switch back to the Admin Dashboard, the student's status will instantly update to "Paid" and the overall collected revenue will increase.

---

## 🛠 Tech Stack

**Frontend**
* React.js (Component-driven UI)
* Tailwind CSS (Utility-first styling & responsiveness)
* React Router DOM (Application routing)
* Lucide React (Consistent iconography)

**Backend & AI Integration**
* RESTful APIs (Handling database queries and student data)
* **Google Gemini API** (Core LLM driving the conversational interface and RAG reasoning)
* Vector Database / Embeddings (For chunking and storing policy documents)
* Interswitch Quickteller Business API (Sandbox integration for secure payment processing and verification)

---

## 🤝 Team & Collaboration Workflow

This project was built collaboratively by a two-person team, dividing the architecture into distinct domains while establishing strict API contracts to ensure seamless integration.

* **Olusola Somorin (UI/UX Design & Frontend Engineering)**
  * Designed the high-fidelity user interface, focusing on cognitive ease for school administrators.
  * Developed the entire React frontend architecture, including the responsive Dashboard layout, the manual "Add Student" modal, and the RAG document upload interface.
  * Built the interactive `ParentChat` portal with the phone number authentication flow, and implemented the Interswitch WebPay Inline script injection to handle client-side checkout.

* **Ajijolaoluwa Adesoji (Backend Engineering & System Integration)**
  * Architected the backend infrastructure and database schema to securely handle student enrollment data and payment statuses.
  * Built the RESTful endpoints for fetching student directories and securely handling manual student additions.
  * Developed the RAG pipeline by integrating the **Google Gemini API**, enabling the ingestion, parsing, and vectorization of uploaded school policy documents for the chatbot.
  * Built the backend verification endpoints that securely communicate with Interswitch's servers to validate successful transactions before updating the database.

---

## ⚙️ Local Setup & Installation

### Prerequisites
* Node.js (v16+)
* Interswitch / Quickteller Business Sandbox Credentials
* Google Gemini API Key

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone [https://github.com/AjeeAI/enyata-hackathon.git](https://github.com/AjeeAI/enyata-hackathon.git)
   ```

2. Navigate to the frontend directory:
    ```bash
    cd enyata-hackathon/frontend 
    ```

3. Install dependencies:**
    ```bash
    npm install
    ```

4. Start the development server:**
    ```bash
    npm run dev
    ```