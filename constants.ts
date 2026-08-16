import { FileNode } from './types';

export const DEMO_PROJECT_STRUCTURE: FileNode = {
  name: 'corruption_tracker_v2',
  type: 'folder',
  children: [
    { 
      name: 'app.py', 
      type: 'file', 
      description: 'Main Streamlit Application entry point',
      content: `# Corruption Tracker V2 - AI Forensic Audit Tool
import streamlit as st
import pandas as pd
from container import Container
from utils.config import Config

# Page Config
st.set_page_config(
    page_title="Corruption Tracker V2", 
    layout="wide", 
    page_icon="⚖️",
    initial_sidebar_state="expanded"
)

def main():
    # Dependency Injection
    container = Container()
    forensics = container.forensics_engine()
    legal_verifier = container.legal_engine()
    
    # Sidebar
    st.sidebar.title("⚖️ Anti-Corruption AI")
    st.sidebar.markdown("---")
    mode = st.sidebar.radio("Investigation Mode", ["Dashboard", "Forensic Audit", "Legal Compliance (RAG)", "FCA Report Gen"])
    
    st.title("Corruption Tracker V2")
    st.markdown(f"### Current Mode: {mode}")
    
    if mode == "Dashboard":
        # Load Data
        df = pd.read_csv("data/public_accounts/council_spend_2024.csv")
        st.metric("Total Spend Analyzed", f"£{df['Amount'].sum():,.2f}")
        st.metric("Anomalies Detected", "12")
        
        st.dataframe(df.head())
        
    elif mode == "Forensic Audit":
        st.subheader("Forensic Audit & Comparison Workbench")
        
        # Comparison Mode Toggle
        use_split_screen = st.toggle("🖥️ Enable Split-Screen Comparison Mode")
        
        if use_split_screen:
            st.markdown("Compare two datasets to find discrepancies or cross-reference financial years.")
            col1, col2 = st.columns(2)
            
            with col1:
                st.info("📂 Dataset A (Base)")
                file_a = st.file_uploader("Upload Base CSV", type=['csv'], key='a')
            
            with col2:
                st.info("📂 Dataset B (Comparison)")
                file_b = st.file_uploader("Upload Comparison CSV", type=['csv'], key='b')
                
            if file_a and file_b:
                df_a = pd.read_csv(file_a)
                df_b = pd.read_csv(file_b)
                
                if st.button("⚖️ Run Comparative Forensics"):
                    st.divider()
                    c1_res, c2_res = st.columns(2)
                    
                    with c1_res:
                        st.success(f"File A: {len(df_a)} transactions")
                        st.dataframe(df_a.head(3))
                        with st.spinner("Analyzing A..."):
                            results_a = forensics.detect_anomalies(0.8)
                        st.write("#### Findings A")
                        st.json(results_a)
                        
                    with c2_res:
                        st.success(f"File B: {len(df_b)} transactions")
                        st.dataframe(df_b.head(3))
                        with st.spinner("Analyzing B..."):
                            results_b = forensics.detect_anomalies(0.8)
                        st.write("#### Findings B")
                        st.json(results_b)
                        
                    # Export Section
                    st.divider()
                    st.subheader("💾 Save Comparison Report")
                    report_content = f"COMPARISON REPORT\\n\\nDataset A Findings:\\n{results_a}\\n\\nDataset B Findings:\\n{results_b}"
                    
                    dl_cols = st.columns(4)
                    dl_cols[0].download_button("📄 Save as Word (.doc)", report_content, "audit_comparison.doc")
                    dl_cols[1].download_button("📝 Save as Notepad (.txt)", report_content, "audit_comparison.txt")
                    
        else:
            # Single File Mode
            uploaded_file = st.file_uploader("Upload CSV", type=['csv'])
            sensitivity = st.slider("ML Sensitivity (Isolation Forest)", 0.0, 1.0, 0.8)
            
            if uploaded_file:
                try:
                    df = pd.read_csv(uploaded_file)
                    st.success(f"✅ Successfully ingested {uploaded_file.name}: {len(df)} rows loaded.")
                    
                    with st.expander("🔍 Preview Uploaded Data", expanded=True):
                        st.dataframe(df.head())
                    
                    # Initialize session state for results
                    if 'audit_results' not in st.session_state:
                        st.session_state.audit_results = None
                    
                    if st.button("Analyze Uploaded CSV"):
                        with st.spinner("Running Forensic Isolation Forest..."):
                            # Store results in session state to persist across reruns
                            st.session_state.audit_results = forensics.detect_anomalies(sensitivity)
                    
                    # Display Results if they exist
                    if st.session_state.audit_results:
                        st.markdown("---")
                        st.subheader("🕵️ Analysis Findings")
                        st.write(st.session_state.audit_results)
                        
                        # Legal Context Button
                        st.markdown("#### ⚖️ Regulatory Compliance Check")
                        if st.button("Analyze with Legal Context"):
                            with st.spinner("Consulting UK Procurement Act 2023 via RAG Engine..."):
                                # Extract relevant context for the legal engine
                                anomaly_data = str(st.session_state.audit_results)
                                legal_opinion = legal_verifier.check_procurement_act(anomaly_data)
                                
                                st.info("📜 Legal Opinion")
                                st.markdown(f"> {legal_opinion}")
                        
                        st.divider()
                        
                        # Report Saving Features
                        st.markdown("### 📂 Export Findings")
                        st.caption("Select a format to save your report:")
                        report_text = f"FORENSIC AUDIT REPORT\\n\\nDate: 2024-03-20\\nFile: {uploaded_file.name}\\nSensitivity: {sensitivity}\\n\\nFindings:\\n{st.session_state.audit_results}"
                        
                        r_col1, r_col2 = st.columns([1,1])
                        with r_col1:
                            st.download_button("📄 Save as Word (.doc)", report_text, "forensic_report.doc", mime="application/msword")
                        with r_col2:
                            st.download_button("📝 Save as Notepad (.txt)", report_text, "forensic_report.txt")

                except Exception as e:
                    st.error(f"Error processing file: {e}")
            else:
                st.info("Waiting for file upload to begin analysis.")
                # Reset results when no file is uploaded
                st.session_state.audit_results = None

    elif mode == "Legal Compliance (RAG)":
        st.subheader("⚖️ Advanced Legal Compliance Engine (RAG)")
        st.markdown("Select the legislative framework to apply to your query. This ensures the AI retrieves context only from relevant statutes.")
        
        col_law, col_input = st.columns([1, 2])
        
        with col_law:
            st.info("📚 Knowledge Base Selector")
            selected_laws = st.multiselect(
                "Select Acts & Regulations",
                [
                    "UK Bribery Act 2010",
                    "Companies Act 2006",
                    "Insolvency Act 1986",
                    "Procurement Act 2023",
                    "Reinsurance Directive (Solvency II)",
                    "Financial Services Act 2021",
                    "Proceeds of Crime Act 2002"
                ],
                default=["Companies Act 2006"]
            )
            
            st.caption(f"Selected Contexts: {len(selected_laws)}")
            
        with col_input:
            st.markdown("📝 **Scenario / Clause Description**")
            query = st.text_area(
                "Describe the scenario or paste contract text:", 
                height=200,
                placeholder="E.g., A director of a solvent company has transferred assets to a subsidiary immediately before declaring insolvency..."
            )
            
        if st.button("⚖️ Run Legal Analysis"):
            if not selected_laws:
                st.error("⚠️ Please select at least one Act to reference.")
            elif not query:
                st.error("⚠️ Please enter a query to analyze.")
            else:
                with st.spinner("Retrieving legal precedents and analyzing..."):
                    response = legal_verifier.analyze_compliance(query, selected_laws)
                    
                    st.markdown("### 🏛️ Legal Analysis Report")
                    st.success("Analysis Complete")
                    st.markdown(f"**Context Applied:** {', '.join(selected_laws)}")
                    st.divider()
                    st.markdown(response)

    elif mode == "FCA Report Gen":
        st.subheader("FCA Regulatory Reporting")
        st.info("Module under construction.")

if __name__ == "__main__":
    main()`
    } 
  ]
};

export const INITIAL_SYSTEM_INSTRUCTION = `You are an expert Senior Software Architect. 
Your task is to analyze the provided project structure and description to provide a comprehensive architectural assessment.
Evaluate the project based on:
1. Scalability and modularity of the structure.
2. Best practices for the detected tech stack.
3. Clarity of separation of concerns.
4. Security and compliance readiness.

Analyze the given structure and return the JSON response satisfying the schema.
`;
