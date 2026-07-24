import os
import json
import subprocess
import sys
import asyncio
import shutil
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Active profile tracking (in-memory, defaults to first profile)
ACTIVE_PROFILE_ID = "default"

PROFILES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "profiles.json")
PROFILES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "profiles")

def get_targets_path(profile_id: str) -> str:
    return os.path.join(PROFILES_DIR, profile_id, "targets.json")

def load_profiles_data() -> dict:
    if not os.path.exists(PROFILES_PATH):
        os.makedirs(PROFILES_DIR, exist_ok=True)
        default_profile = {
            "id": "default",
            "name": "Dubstrata Research",
            "business_context": "Dubstrata is the Multi-Tenant Alternative Data Engine & Agentic CDN for Causal Financial Truth. We deconstruct prediction market probabilities and unstructured sentiment into clean, causally justified, structured truth.",
            "targets_icp": "Quantitative developers, systematic hedge funds, and autonomous agent developers.",
            "give_first_asset": "Model Context Protocol (MCP) server or sample Parquet dataset",
            "system_prompt_synthesis": (
                "You are a B2B lead intelligence agent sourcing partners and customers.\n"
                "Analyze the target's GitHub repository name, language, and description to synthesize custom target insights.\n"
                "Produce structured intelligence matching the response schema: segment, technical observed need, a bespoke give-first asset, recent_filing_or_post, pain points, targeted jargon, and value proposition."
            ),
            "system_prompt_outreach": (
                "You are writing a cold outreach message on behalf of our team.\n"
                "Your objective is to establish peer-to-peer technical authority by diagnosing their systemic issues and offering immediate asset access.\n"
                "STRICT STYLE & BEHAVIORAL CONSTRAINTS:\n"
                "1. Sentence Count: The entire message body must be strictly 3 to 4 sentences.\n"
                "2. Strict Sentence Length: No single sentence can exceed 20 words.\n"
                "3. Active Line Breaks: Place a blank line between every single sentence.\n"
                "4. Zero Fluff: No intro greetings or pleasantries. Start immediately.\n"
                "5. Tone: Clinically detached, technical, zero sales speak or meeting pitches.\n"
            ),
            "search_queries_ai": [
                "model-context-protocol stars:>5",
                "solana-ai-agents stars:>5"
            ],
            "search_queries_quant": [
                "backtesting-engine stars:>10",
                "quant-trading stars:>10"
            ],
            "search_queries_maps": [
                "software agencies in San Francisco"
            ],
            "search_interval_seconds": 7200,
            "email_config": {
                "provider": "privateemail",
                "email_address": "muzikhuzwayo@techfusion-ventures.xyz",
                "password": "",
                "smtp_server": "mail.privateemail.com",
                "smtp_port": 465,
                "imap_server": "mail.privateemail.com",
                "imap_port": 993
            }
        }
        data = {
            "active_profile_id": "default",
            "profiles": [default_profile]
        }
        os.makedirs(os.path.dirname(PROFILES_PATH), exist_ok=True)
        with open(PROFILES_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        # Migrate old targets.json to default if it exists
        old_targets_path = os.path.join(os.path.dirname(__file__), "..", "data", "targets.json")
        default_targets_path = get_targets_path("default")
        os.makedirs(os.path.dirname(default_targets_path), exist_ok=True)
        if os.path.exists(old_targets_path):
            try:
                shutil.copy(old_targets_path, default_targets_path)
            except Exception as e:
                print(f"Error migrating targets.json: {e}")
        else:
            with open(default_targets_path, "w", encoding="utf-8") as f:
                json.dump([], f)
                
    with open(PROFILES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        # Ensure search_queries_maps is present for all profiles
        dirty = False
        for p in data.get("profiles", []):
            if "search_queries_maps" not in p:
                p["search_queries_maps"] = ["software agencies in San Francisco"]
                dirty = True
        if dirty:
            with open(PROFILES_PATH, "w", encoding="utf-8") as wf:
                json.dump(data, wf, indent=2)
        return data

def save_profiles_data(data: dict):
    with open(PROFILES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def load_leads():
    global ACTIVE_PROFILE_ID
    profiles_data = load_profiles_data()
    ACTIVE_PROFILE_ID = profiles_data.get("active_profile_id", "default")
    targets_path = get_targets_path(ACTIVE_PROFILE_ID)
    if not os.path.exists(targets_path):
        os.makedirs(os.path.dirname(targets_path), exist_ok=True)
        with open(targets_path, "w", encoding="utf-8") as f:
            json.dump([], f)
        return []
    try:
        with open(targets_path, "r", encoding="utf-8") as f:
            leads = json.load(f)
            for lead in leads:
                if "drafts" not in lead:
                    lead["drafts"] = {"email": "", "linkedin": "", "x": ""}
                if "history" not in lead:
                    lead["history"] = []
            return leads
    except Exception as e:
        print(f"Error loading leads: {e}")
        return []

def save_leads(leads):
    global ACTIVE_PROFILE_ID
    targets_path = get_targets_path(ACTIVE_PROFILE_ID)
    try:
        os.makedirs(os.path.dirname(targets_path), exist_ok=True)
        with open(targets_path, "w", encoding="utf-8") as f:
            json.dump(leads, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving leads: {e}")
        return False

async def run_scheduler():
    print("Background scheduler started: will trigger research at profile-defined intervals.")
    while True:
        try:
            profiles_data = load_profiles_data()
            active_id = profiles_data.get("active_profile_id", "default")
            profile = next((p for p in profiles_data["profiles"] if p["id"] == active_id), None)
            interval = profile.get("search_interval_seconds", 7200) if profile else 7200
            
            await asyncio.sleep(interval)
            print("Scheduler: triggering research ingestion pipeline in background thread...")
            await asyncio.to_thread(trigger_research)
        except asyncio.CancelledError:
            print("Scheduler task cancelled.")
            break
        except Exception as e:
            print(f"Scheduler error: {e}")
            await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler_task = asyncio.create_task(run_scheduler())
    yield
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Aura Partner Research Harness", lifespan=lifespan)

# Load .env file manually if it exists in root folder
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip() and not line.startswith("#") and "=" in line:
                    key, val = line.strip().split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")
        
        for proxy_var in ["HTTP_PROXY", "HTTPS_PROXY"]:
            proxy_val = os.environ.get(proxy_var, "")
            if "localhost:517" in proxy_val or "127.0.0.1:517" in proxy_val:
                os.environ.pop(proxy_var, None)
    except Exception as e:
        print(f"Error reading .env: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dynamic Segment-Specific Context & Fallbacks Mapping
SEGMENT_TEMPLATES = {
    "Quantitative Hedge Funds & Systematic Trading Desks": {
        "persona": "an expert quantitative research engineer",
        "pain_points": "Noisy alternative data, look-ahead bias in backtests, lack of point-in-time consistency, over-reliance on surface-level sentiment.",
        "jargon": "point-in-time Parquet exports via PyArrow, alpha signals, systemic backtesting, Cypher-based POSITIONS_ON / EXPOSED_TO graph traversals, Polymarket whale profiles, Inference Conviction Index (ICI).",
        "value_proposition": "We provide clean, causally justified, structured consensus and narrative data feeds to differentiate your strategy from the hype-chasing crowd.",
        "default_asset": "s3://dubstrata-public-samples/tsmc-supply-chain.parquet",
        "email_fallback": (
            "Subject: Event sentiment and point-in-time backtesting data\n\n"
            "{first_name},\n\n"
            "We processed the latest alternative event records matching your quantitative research context.\n\n"
            "I put together a clean, point-in-time Parquet dataset representing TSMC's lower-tier supplier exposures to backtest. No signups or calls. "
            "I've uploaded the sample to: {asset}. Would you like the access credentials?\n\n"
            "Best,\n[Your Name]"
        ),
        "dm_fallback": (
            "{first_name}, saw your work on systematic event sentiment. We built a point-in-time Parquet dataset "
            "mapping TSMC's supply chain exposures to test against backtests—no login or pitch required. "
            "The sample is on S3 at {asset}. Let me know if you want the access keys."
        )
    },
    "Traditional Asset Managers & Macro Analysts": {
        "persona": "a senior investment intelligence analyst",
        "pain_points": "Causal mapping gaps, mapping macro factors (Event A -> Entity B -> Asset C), manual extraction of policy shifts, weeding out speculative noise.",
        "jargon": "causal knowledge graphs, supply chain risk cascades, geopolitical arbitrage, Open-Meteo synchronous integration, FDA approval trackers, causal contradiction engine, Deep Research Intelligence Report.",
        "value_proposition": "We map global event narratives directly to asset exposure nodes to provide reliable, verifiable consensus data.",
        "default_asset": "a draft of our Deep Research Intelligence Report on supply-chain bottlenecks",
        "email_fallback": (
            "Subject: Causal macro analysis: TSMC supply chain risk cascade\n\n"
            "{first_name},\n\n"
            "We built a causal mapping tracing how specific regulatory shifts and geopolitical delays in Asia cascade down to exposed US equities.\n\n"
            "I pulled a tailored PDF version of our Deep Research Intelligence Report mapping these dependencies directly to your portfolio context. "
            "No sales pitches—just a clean causal breakdown. Can I send over the link to the draft?\n\n"
            "Best,\n[Your Name]"
        ),
        "dm_fallback": (
            "{first_name}, saw your macro work. We mapped how East Asian geopolitical actions cascade down to US hardware stocks. "
            "No generic vectors—it's a clean causal graph breakdown. I compiled this into a Deep Research Intelligence Report "
            "({asset}). Open to taking a look?"
        )
    },
    "Corporate Risk Officers & Compliance Directors": {
        "persona": "a risk management architect",
        "pain_points": "Supply chain vulnerabilities, lack of compliance transparency across decentralized custody, audit trail complexity for multi-tier vendors.",
        "jargon": "low-tier supplier exposures, cryptographic auditing, immutable agent_identity_logs, entity salience categories, tenant-isolated private graph overlays.",
        "value_proposition": "We deliver compliance-aligned alternative data feeds with zero-trust logical provenance and auditability.",
        "default_asset": "our secure compliance schema audit and sample ledger logs",
        "email_fallback": (
            "Subject: Cryptographic auditing and multi-tier supplier risks\n\n"
            "{first_name},\n\n"
            "We've structured a pipeline for mapping low-tier supply dependencies while maintaining rigorous tenant isolation.\n\n"
            "I put together a sample export of our immutable compliance logs and ledger schemas showing how we track vendor vulnerabilities without exposing sensitive internal data. "
            "No meeting required. Would you be interested in checking out the schema?\n\n"
            "Best,\n[Your Name]"
        ),
        "dm_fallback": (
            "{first_name}, tracking your focus on corporate supply chain compliance. We mapped low-tier supplier dependencies "
            "using an isolated private graph overlay with immutable agent logs to preserve non-repudiation. "
            "I put together a sample ledger schema and risk overview ({asset}). Can I drop you the file to review?"
        )
    },
    "Autonomous AI Agent Developers & Web3/DeFi Protocol Teams": {
        "persona": "a Web3 core systems engineer",
        "pain_points": "Bypassing SaaS credit card limits for autonomous agents, high API overhead on idle web searches, data access interfaces for agents.",
        "jargon": "Model Context Protocol (MCP) servers, x402 Micropayments gateway, Solana USDC micro-billing, Ed25519 wallet rotation, Zero-Fee JIT crawler protection.",
        "value_proposition": "We provide real-time causal truth data feeds seamlessly integrated with open-source Model Context Protocol (MCP) servers.",
        "default_asset": "https://github.com/dubstrata/dubstrata-mcp",
        "email_fallback": (
            "Subject: Open-source Model Context Protocol server for AI agents\n\n"
            "{first_name},\n\n"
            "We solved subscription credit card limitations for autonomous agents using Solana USDC micropayments.\n\n"
            "We open-sourced a Model Context Protocol (MCP) server that lets agents query our financial knowledge graph and pay dynamically per row. "
            "The repo is public at {asset}. Would you be open to taking a look?\n\n"
            "Best,\n[Your Name]"
        ),
        "dm_fallback": (
            "{first_name}, saw your repo on agent funds. We built a public MCP server ({asset}) "
            "that lets agents pay dynamically per row using Solana/USDC signatures to bypass SaaS sub limits. "
            "Takes 2 minutes to run locally. Open to taking a look?"
        )
    }
}

# Pydantic models for Profile update
class EmailConfigModel(BaseModel):
    provider: str
    email_address: str
    password: str
    smtp_server: str = ""
    smtp_port: int = 465
    imap_server: str = ""
    imap_port: int = 993

class ProfileConfigModel(BaseModel):
    name: str
    business_context: str
    targets_icp: str
    give_first_asset: str
    system_prompt_synthesis: str
    system_prompt_outreach: str
    search_queries_ai: list[str]
    search_queries_quant: list[str]
    search_queries_maps: list[str] = []
    search_interval_seconds: int
    email_config: EmailConfigModel

class CreateProfileModel(BaseModel):
    name: str

class UpdateLeadRequest(BaseModel):
    id: str
    status: str
    custom_notes: str
    channels: dict = None

class SaveDraftRequest(BaseModel):
    id: str
    channel: str
    draft_text: str

class PushDraftRequest(BaseModel):
    id: str
    draft_text: str

class SynthesizeRequest(BaseModel):
    id: str

class LeadIntelligence(BaseModel):
    segment: str = Field(..., description="The dynamic segment category (e.g. AI Agents or Quantitative Trading).")
    observed_need: str = Field(..., description="A concise description of their project's technical needs.")
    sample_dataset_type: str = Field(..., description="Bespoke asset to offer them based on their codebase.")
    recent_filing_or_post: str = Field(..., description="A technical summary of their repository description or stack.")
    pain_points: str = Field(..., description="Specific developer pain points based on their repository's purpose.")
    jargon: str = Field(..., description="2-3 technical keywords or concepts relevant to their codebase.")
    value_proposition: str = Field(..., description="Tailored value proposition.")

class LogHistoryRequest(BaseModel):
    id: str
    type: str
    channel: str = ""
    content: str = ""
    status_from: str = ""
    status_to: str = ""

class GenerateRequest(BaseModel):
    id: str
    channel: str
    custom_modifier: str = ""

class OutreachDraft(BaseModel):
    subject: str = Field(..., description="Subject line. Keep blank ('') for social DMs.")
    body: str = Field(..., description="The message body.")

class SearchQueries(BaseModel):
    ai_queries: list[str] = Field(..., description="GitHub repository search query strings for AI/Web3 agents.")
    quant_queries: list[str] = Field(..., description="GitHub repository search query strings for quantitative finance.")

class EnhanceIcpRequest(BaseModel):
    targets_icp: str
    business_context: str

class RefineProfileRequest(BaseModel):
    targets_icp: str
    business_context: str

def get_segment_config(segment_name: str) -> dict:
    if not segment_name:
        return SEGMENT_TEMPLATES["Quantitative Hedge Funds & Systematic Trading Desks"]
    segment_name_lower = segment_name.lower()
    for key, config in SEGMENT_TEMPLATES.items():
        if segment_name_lower in key.lower() or key.lower() in segment_name_lower:
            return config
    if "quant" in segment_name_lower or "hedge" in segment_name_lower or "trading" in segment_name_lower:
        return SEGMENT_TEMPLATES["Quantitative Hedge Funds & Systematic Trading Desks"]
    elif "asset" in segment_name_lower or "pm" in segment_name_lower or "macro" in segment_name_lower or "analyst" in segment_name_lower:
        return SEGMENT_TEMPLATES["Traditional Asset Managers & Macro Analysts"]
    elif "risk" in segment_name_lower or "compliance" in segment_name_lower or "corporate" in segment_name_lower:
        return SEGMENT_TEMPLATES["Corporate Risk Officers & Compliance Directors"]
    elif "agent" in segment_name_lower or "web3" in segment_name_lower or "defi" in segment_name_lower or "developer" in segment_name_lower:
        return SEGMENT_TEMPLATES["Autonomous AI Agent Developers & Web3/DeFi Protocol Teams"]
    return SEGMENT_TEMPLATES["Quantitative Hedge Funds & Systematic Trading Desks"]

@app.get("/api/leads")
def get_leads_api():
    return load_leads()

# AI ICP enhancement endpoint
@app.post("/api/ai/enhance-icp")
def enhance_icp(req: EnhanceIcpRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"enhanced_icp": req.targets_icp + "\n\n(AI Enhancement requires GEMINI_API_KEY in environment)"}
    try:
        client = genai.Client(api_key=api_key)
        prompt = (
            f"You are a target profile optimization engine. Enhance the following ICP target description for B2B discovery.\n"
            f"Business Context: {req.business_context}\n"
            f"Raw ICP Targets: {req.targets_icp}\n"
            f"Return only the beautifully structured, optimized, and concise ICP description (max 150 words)."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if response.text:
            return {"enhanced_icp": response.text.strip()}
    except Exception as e:
        print(f"Error enhancing ICP: {e}")
    return {"enhanced_icp": req.targets_icp}

# AI Profile Refiner endpoint
@app.post("/api/ai/refine-profile")
def refine_profile(req: RefineProfileRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "refined_business_context": req.business_context + "\n\n(AI Refinement requires GEMINI_API_KEY in environment)",
            "refined_targets_icp": req.targets_icp + "\n\n(AI Refinement requires GEMINI_API_KEY in environment)"
        }
    try:
        client = genai.Client(api_key=api_key)
        prompt = (
            f"You are a strategic business and ICP optimization agent.\n"
            f"Your job is to refine and add professional depth, clarity, and dimension to the user's business context and ICP targets.\n\n"
            f"Current Business Context: {req.business_context}\n"
            f"Current ICP Targets: {req.targets_icp}\n\n"
            f"Provide a structured response in valid JSON containing two fields: \n"
            f"1. 'refined_business_context': a polished, professional description of the business context with enhanced clarity.\n"
            f"2. 'refined_targets_icp': a clear, multi-dimensional definition of the target profiles and ideal customer personas.\n"
        )
        
        class RefinedProfileResponse(BaseModel):
            refined_business_context: str
            refined_targets_icp: str
            
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RefinedProfileResponse,
            )
        )
        if response.text:
            return json.loads(response.text)
    except Exception as e:
        print(f"Error refining profile: {e}")
        
    return {
        "refined_business_context": req.business_context,
        "refined_targets_icp": req.targets_icp
    }

# Multi-Profile API Routes
@app.get("/api/profiles")
def get_profiles():
    return load_profiles_data()

@app.post("/api/profiles")
def create_profile(req: CreateProfileModel):
    data = load_profiles_data()
    new_id = "profile_" + str(int(datetime.utcnow().timestamp()))
    new_profile = {
        "id": new_id,
        "name": req.name,
        "business_context": "We provide custom alternative data streams and software solutions to partners.",
        "targets_icp": "Software engineers, developers, and tech lead professionals.",
        "give_first_asset": "https://github.com/example/sample-repo",
        "system_prompt_synthesis": (
            "You are an AI research assistant sourcing partners.\n"
            "Analyze the target's GitHub repository to synthesize custom target insights.\n"
            "Produce structured intelligence matching the response schema: segment, observed_need, sample_dataset_type, recent_filing_or_post, pain_points, jargon, and value_proposition."
        ),
        "system_prompt_outreach": (
            "You are writing a cold outreach message on behalf of our team.\n"
            "STRICT STYLE CONSTRAINTS:\n"
            "1. Strictly 3 to 4 sentences.\n"
            "2. No single sentence can exceed 20 words.\n"
            "3. Empty line between every single sentence.\n"
            "4. Zero greeting fluff. Start immediately.\n"
        ),
        "search_queries_ai": ["ai-agents stars:>5"],
        "search_queries_quant": ["backtesting stars:>5"],
        "search_queries_maps": ["software agencies in San Francisco"],
        "search_interval_seconds": 7200,
        "email_config": {
            "provider": "gmail",
            "email_address": "",
            "password": "",
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 465,
            "imap_server": "imap.gmail.com",
            "imap_port": 993
        }
    }
    data["profiles"].append(new_profile)
    save_profiles_data(data)
    
    # Init targets json file for this profile
    t_path = get_targets_path(new_id)
    os.makedirs(os.path.dirname(t_path), exist_ok=True)
    with open(t_path, "w", encoding="utf-8") as f:
        json.dump([], f)
        
    return {"status": "success", "profile": new_profile}

@app.post("/api/profiles/active")
def set_active_profile(req: dict):
    profile_id = req.get("profile_id")
    if not profile_id:
        raise HTTPException(status_code=400, detail="profile_id is required")
    data = load_profiles_data()
    exists = any(p["id"] == profile_id for p in data["profiles"])
    if not exists:
        raise HTTPException(status_code=404, detail="Profile not found")
    data["active_profile_id"] = profile_id
    save_profiles_data(data)
    
    global ACTIVE_PROFILE_ID
    ACTIVE_PROFILE_ID = profile_id
    
    return {"status": "success", "active_profile_id": profile_id, "leads": load_leads()}

@app.post("/api/profiles/{profile_id}/config")
def save_profile_config(profile_id: str, config: ProfileConfigModel):
    data = load_profiles_data()
    found = False
    for p in data["profiles"]:
        if p["id"] == profile_id:
            p["name"] = config.name
            p["business_context"] = config.business_context
            p["targets_icp"] = config.targets_icp
            p["give_first_asset"] = config.give_first_asset
            p["system_prompt_synthesis"] = config.system_prompt_synthesis
            p["system_prompt_outreach"] = config.system_prompt_outreach
            p["search_queries_ai"] = config.search_queries_ai
            p["search_queries_quant"] = config.search_queries_quant
            p["search_queries_maps"] = config.search_queries_maps
            p["search_interval_seconds"] = config.search_interval_seconds
            p["email_config"] = config.email_config.model_dump()
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Profile not found")
    save_profiles_data(data)
    return {"status": "success"}

@app.post("/api/leads/update")
def update_lead(req: UpdateLeadRequest):
    leads = load_leads()
    found = False
    for lead in leads:
        if lead["id"] == req.id:
            if lead["status"] != req.status:
                lead["history"].append({
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "type": "status_change",
                    "status_from": lead["status"],
                    "status_to": req.status,
                    "channel": "",
                    "content": f"Status updated to {req.status}"
                })
            lead["status"] = req.status
            lead["custom_notes"] = req.custom_notes
            if req.channels is not None:
                lead["channels"] = req.channels
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Lead not found")
    save_leads(leads)
    return {"status": "success"}

@app.post("/api/leads/trigger-research")
def trigger_research():
    profiles_data = load_profiles_data()
    active_id = profiles_data.get("active_profile_id", "default")
    profile = next((p for p in profiles_data["profiles"] if p["id"] == active_id), None)
    
    ai_queries = profile.get("search_queries_ai", []) if profile else []
    quant_queries = profile.get("search_queries_quant", []) if profile else []
    
    leads = load_leads()
    existing_owners = []
    existing_repos = []
    for lead in leads:
        github_url = lead.get("channels", {}).get("github", "")
        if github_url and "github.com/" in github_url:
            parts = github_url.split("github.com/")[-1].split("/")
            if len(parts) >= 2:
                existing_owners.append(parts[0])
                existing_repos.append(parts[1])

    # Ask Gemini to rotate search queries if API Key is present
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and ai_queries and quant_queries:
        try:
            print("Prompting Gemini for fresh GitHub search queries...")
            client = genai.Client(api_key=api_key)
            system_instruction = (
                "You are an AI research assistant sourcing B2B target leads.\n"
                "Analyze existing target list and return 3 fresh search queries for AI and 3 for Quant.\n"
                "Respond in valid JSON matching the SearchQueries schema."
            )
            prompt = (
                f"Base AI queries: {ai_queries}\n"
                f"Base Quant queries: {quant_queries}\n"
                f"Existing owners already sourced: {existing_owners[:20]}\n"
                f"Existing repos already sourced: {existing_repos[:20]}\n"
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                    response_mime_type="application/json",
                    response_schema=SearchQueries,
                )
            )
            if response.text:
                parsed = json.loads(response.text)
                ai_queries = parsed.get("ai_queries", ai_queries)
                quant_queries = parsed.get("quant_queries", quant_queries)
        except Exception as e:
            print(f"Error rotating queries: {e}")

    try:
        pipeline_path = os.path.join(os.path.dirname(__file__), "pipeline.py")
        print("Running ingestion subprocess...")
        ai_queries_arg = json.dumps(ai_queries)
        quant_queries_arg = json.dumps(quant_queries)
        
        # Ingestion writes to temp targets.json
        temp_targets_path = os.path.join(os.path.dirname(__file__), "..", "data", "targets.json")
        if os.path.exists(temp_targets_path):
            os.remove(temp_targets_path)
            
        result = subprocess.run(
            [sys.executable, pipeline_path, "--ai-queries", ai_queries_arg, "--quant-queries", quant_queries_arg],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"Pipeline error: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Pipeline error: {result.stderr}")
            
        # Merge temp targets.json into profile targets.json
        if os.path.exists(temp_targets_path):
            with open(temp_targets_path, "r", encoding="utf-8") as f:
                scraped_leads = json.load(f)
            
            lead_map = {l["id"]: l for l in leads}
            for sl in scraped_leads:
                sid = sl["id"]
                if sid not in lead_map:
                    lead_map[sid] = sl
                else:
                    existing = lead_map[sid]
                    sl["status"] = existing.get("status", "Ready")
                    sl["custom_notes"] = existing.get("custom_notes", "")
                    sl["drafts"] = existing.get("drafts", {"email": "", "linkedin": "", "x": ""})
                    sl["history"] = existing.get("history", [])
                    lead_map[sid] = sl
            
            leads = list(lead_map.values())
            save_leads(leads)
            os.remove(temp_targets_path)

        # Run Google Maps Discovery via Gemini + Google Search Grounding Tool
        maps_queries = profile.get("search_queries_maps", []) if profile else []
        maps_leads = []
        import urllib.parse
        if api_key and maps_queries:
            try:
                print(f"Querying Google Search Grounding for local businesses using maps_queries: {maps_queries}")
                client = genai.Client(api_key=api_key)
                for m_query in maps_queries:
                    if not m_query.strip():
                        continue
                    
                    class LocalBusiness(BaseModel):
                        name: str = Field(..., description="Name of the business or organization")
                        website: str = Field("", description="Website URL or official page of the business")
                        phone: str = Field("", description="Phone number of the business")
                        address: str = Field("", description="Physical street address or city location of the business")
                        description: str = Field(..., description="A short summary of what this business does")
                        jargon: str = Field(..., description="2-3 industry keywords or tech jargon relevant to their business")
                        pain_points: str = Field(..., description="Typical technical or operational pain points for this B2B profile")

                    class LocalBusinessList(BaseModel):
                        businesses: list[LocalBusiness]

                    prompt = (
                        f"Perform a search on Google Maps / Google Search to find top local businesses matching the query: '{m_query}'.\n"
                        f"Return a structured list of at least 3 to 5 real businesses matching this query with complete details."
                    )

                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            tools=[types.Tool(google_search=types.GoogleSearch())],
                            response_mime_type="application/json",
                            response_schema=LocalBusinessList,
                        )
                    )
                    if response.text:
                        parsed = json.loads(response.text)
                        for bus in parsed.get("businesses", []):
                            bus_id = "maps_" + bus["name"].lower().replace(" ", "_").replace("'", "").replace('"', "")
                            maps_leads.append({
                                "id": bus_id,
                                "name": bus["name"],
                                "role": "Local Business Lead",
                                "firm": bus["name"],
                                "location": bus["address"] or "Local",
                                "segment": "Local Search (Google Maps)",
                                "channels": {
                                    "email": "",
                                    "linkedin": f"https://linkedin.com/search/results/all/?keywords={urllib.parse.quote(bus['name'])}",
                                    "x": "",
                                    "github": "",
                                    "twitter_handle": "",
                                    "website": bus["website"]
                                },
                                "technical_signals": {
                                    "observed_need": f"Local business identified via Google Maps. Service description: {bus['description']}",
                                    "sample_dataset_type": profile.get("give_first_asset", "Custom introductory overview"),
                                    "recent_filing_or_post": f"Located at: {bus['address']}. Phone: {bus['phone']}"
                                },
                                "status": "Ready",
                                "custom_notes": f"Observed via Google Maps query: {m_query}",
                                "raw_metadata": {
                                    "address": bus["address"],
                                    "phone": bus["phone"],
                                    "description": bus["description"],
                                    "jargon": bus["jargon"],
                                    "pain_points": bus["pain_points"]
                                },
                                "drafts": {
                                    "email": "",
                                    "linkedin": "",
                                    "x": ""
                                },
                                "history": []
                            })
            except Exception as e:
                print(f"Error querying Google Maps through Gemini Search: {e}")
                
        # Merge maps_leads into lead database
        if maps_leads:
            lead_map = {l["id"]: l for l in leads}
            for ml in maps_leads:
                mid = ml["id"]
                if mid not in lead_map:
                    lead_map[mid] = ml
                else:
                    existing = lead_map[mid]
                    ml["status"] = existing.get("status", "Ready")
                    ml["custom_notes"] = existing.get("custom_notes", "")
                    ml["drafts"] = existing.get("drafts", {"email": "", "linkedin": "", "x": ""})
                    ml["history"] = existing.get("history", [])
                    lead_map[mid] = ml
            leads = list(lead_map.values())
            save_leads(leads)
            
        return leads
    except Exception as e:
        print(f"Error running research: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/leads/save-draft")
def save_draft(req: SaveDraftRequest):
    leads = load_leads()
    lead = next((l for l in leads if l["id"] == req.id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if "drafts" not in lead:
        lead["drafts"] = {"email": "", "linkedin": "", "x": ""}
    lead["drafts"][req.channel] = req.draft_text
    lead["history"].append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": "edited",
        "channel": req.channel,
        "content": req.draft_text[:60] + "..." if len(req.draft_text) > 60 else req.draft_text
    })
    save_leads(leads)
    return {"status": "success"}

@app.post("/api/leads/send-privateemail-draft")
def send_email_draft(req: PushDraftRequest):
    profiles_data = load_profiles_data()
    active_id = profiles_data.get("active_profile_id", "default")
    profile = next((p for p in profiles_data["profiles"] if p["id"] == active_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Active profile not found")
        
    email_cfg = profile.get("email_config", {})
    email_address = email_cfg.get("email_address", "")
    password = email_cfg.get("password", "")
    provider = email_cfg.get("provider", "custom")
    
    imap_server = email_cfg.get("imap_server", "")
    imap_port = int(email_cfg.get("imap_port", 993))
    
    if provider == "gmail":
        imap_server = imap_server or "imap.gmail.com"
    elif provider == "outlook":
        imap_server = imap_server or "outlook.office365.com"
    elif provider == "yahoo":
        imap_server = imap_server or "imap.mail.yahoo.com"
    elif provider == "privateemail":
        imap_server = imap_server or "mail.privateemail.com"

    if not email_address or not password:
        raise HTTPException(
            status_code=400, 
            detail="Email address or password is not configured in settings for this profile."
        )

    leads = load_leads()
    lead = next((l for l in leads if l["id"] == req.id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    to_email = lead.get("channels", {}).get("email", "")
    if not to_email:
        to_email = email_address

    subject = "Partner Research Discovery"
    body = req.draft_text
    
    lines = req.draft_text.split('\n')
    subject_line = next((l for l in lines if l.startswith('Subject: ')), None)
    if subject_line:
        subject = subject_line.replace('Subject: ', '').strip()
        body_lines = [l for l in lines if not l.startswith('Subject: ')]
        body = '\n'.join(body_lines).strip()

    import imaplib
    import time
    from email.message import EmailMessage

    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = email_address
        msg['To'] = to_email
        msg.set_content(body)

        print(f"Connecting to {imap_server}:{imap_port} for {email_address}...")
        mail = imaplib.IMAP4_SSL(imap_server, imap_port)
        mail.login(email_address, password)
        
        drafts_folder = "Drafts"
        try:
            status, folders = mail.list()
            folder_names = []
            for f in folders:
                parts = f.decode('utf-8').split(' "/" ')
                if len(parts) > 1:
                    folder_names.append(parts[1].strip('"'))
                else:
                    parts = f.decode('utf-8').split(' ')
                    folder_names.append(parts[-1].strip('"'))
            
            match = next((fn for fn in folder_names if fn.lower() == "drafts"), None)
            if not match:
                match = next((fn for fn in folder_names if "draft" in fn.lower()), None)
            if match:
                drafts_folder = match
        except Exception as folder_err:
            print(f"Error listing folders: {folder_err}")

        print(f"Appending draft to folder: {drafts_folder}...")
        res, data = mail.append(
            drafts_folder, 
            "(\\Draft)", 
            imaplib.Time2Internaldate(time.time()), 
            msg.as_bytes()
        )
        
        if res != "OK":
            raise Exception(f"Failed to append draft: {data}")
            
        mail.logout()
        
        lead["history"].append({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "type": "sent",
            "channel": "email",
            "content": f"Saved draft to {provider.capitalize()}: {subject}"
        })
        lead["status"] = "Sent"
        save_leads(leads)
        return {"status": "success"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"IMAP Error: {str(e)}")

@app.post("/api/leads/log-history")
def log_history(req: LogHistoryRequest):
    leads = load_leads()
    lead = next((l for l in leads if l["id"] == req.id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead["history"].append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": req.type,
        "channel": req.channel,
        "content": req.content,
        "status_from": req.status_from,
        "status_to": req.status_to
    })
    if req.type == "sent" and lead["status"] != "Sent":
        lead["status"] = "Sent"
    save_leads(leads)
    return {"status": "success"}

def run_synthesis_logic(lead, api_key, leads):
    profiles_data = load_profiles_data()
    active_id = profiles_data.get("active_profile_id", "default")
    profile = next((p for p in profiles_data["profiles"] if p["id"] == active_id), None)
    
    raw_meta = lead.get("raw_metadata", {})
    repo_name = raw_meta.get("repo_name", lead.get("firm", ""))
    repo_desc = raw_meta.get("repo_description", lead.get("technical_signals", {}).get("recent_filing_or_post", ""))
    lang = raw_meta.get("primary_language", "Python")
    
    client = genai.Client(api_key=api_key)
    system_instruction = (
        profile.get("system_prompt_synthesis") if profile else 
        "You are an AI research assistant. Analyze the repository details to synthesize B2B partner insights."
    )
    system_instruction += "\nProduce structured intelligence matching the response schema."
    
    prompt = (
        f"Developer/Firm: {lead.get('name')} ({lead.get('firm')})\n"
        f"Primary Language: {lang}\n"
        f"Repository Name: {repo_name}\n"
        f"Repository Description: {repo_desc}\n"
    )
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            response_mime_type="application/json",
            response_schema=LeadIntelligence,
        )
    )
    if response.text:
        intel = json.loads(response.text)
        lead["segment"] = intel.get("segment", lead["segment"])
        if "technical_signals" not in lead:
            lead["technical_signals"] = {}
        lead["technical_signals"]["observed_need"] = intel.get("observed_need", lead["technical_signals"].get("observed_need", ""))
        lead["technical_signals"]["sample_dataset_type"] = intel.get("sample_dataset_type", lead["technical_signals"].get("sample_dataset_type", ""))
        lead["technical_signals"]["recent_filing_or_post"] = intel.get("recent_filing_or_post", lead["technical_signals"].get("recent_filing_or_post", ""))
        lead["technical_signals"]["pain_points"] = intel.get("pain_points", "")
        lead["technical_signals"]["jargon"] = intel.get("jargon", "")
        lead["technical_signals"]["value_proposition"] = intel.get("value_proposition", "")
        lead["technical_signals"]["synthesized"] = True
        save_leads(leads)
    return lead

@app.post("/api/leads/synthesize-intelligence")
def synthesize_intelligence(req: SynthesizeRequest):
    leads = load_leads()
    lead = next((l for l in leads if l["id"] == req.id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY not configured in environment.")
    updated_lead = run_synthesis_logic(lead, api_key, leads)
    return updated_lead

@app.post("/api/generate")
def generate_outreach(req: GenerateRequest):
    leads = load_leads()
    lead = next((l for l in leads if l["id"] == req.id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.get("technical_signals", {}).get("synthesized"):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                lead = run_synthesis_logic(lead, api_key, leads)
            except Exception as e:
                print(f"Skipping auto-synthesis due to error: {e}")

    profiles_data = load_profiles_data()
    active_id = profiles_data.get("active_profile_id", "default")
    profile = next((p for p in profiles_data["profiles"] if p["id"] == active_id), None)

    if lead.get("technical_signals", {}).get("synthesized"):
        segment_config = {
            "persona": f"outreach lead on behalf of {profile.get('name') if profile else 'Aura'}",
            "pain_points": lead["technical_signals"].get("pain_points", ""),
            "jargon": lead["technical_signals"].get("jargon", ""),
            "value_proposition": lead["technical_signals"].get("value_proposition", ""),
            "default_asset": lead["technical_signals"].get("sample_dataset_type", ""),
            "email_fallback": "Subject: Custom data feed\n\nHi,\n\nWe structured a clean feed: {asset}.\n\nBest,\nTeam",
            "dm_fallback": "Saw your project. We built a custom feed: {asset}."
        }
        give_first_asset = lead["technical_signals"].get("sample_dataset_type", "")
        recent_signal = lead["technical_signals"].get("recent_filing_or_post", "")
    else:
        segment_config = get_segment_config(lead.get("segment", ""))
        give_first_asset = lead.get("technical_signals", {}).get("sample_dataset_type", "") or segment_config["default_asset"]
        recent_signal = lead.get("technical_signals", {}).get("recent_filing_or_post", "recent analytical operations")

    system_instruction = (
        f"You are writing a cold outreach message on behalf of {profile.get('name') if profile else 'our team'}, acting as {segment_config['persona']}.\n"
        f"Business Context: {profile.get('business_context') if profile else 'B2B outreach provider'}\n\n"
        f"Recipient is in segment: '{lead.get('segment')}' and faces these pain points: {segment_config['pain_points']}.\n"
        f"Value Prop: {segment_config['value_proposition']}.\n\n"
        f"{profile.get('system_prompt_outreach') if profile else 'strictly 3 to 4 sentences.'}\n"
        f"Format for channel: {req.channel.upper()}.\n"
        "Respond strictly in valid JSON matching the specified response schema."
    )

    prompt = (
        f"Recipient Name: {lead['name']}\n"
        f"Title/Role: {lead['role']} at {lead['firm']}\n"
        f"Segment: {lead['segment']}\n"
        f"Technical Context/Signals: {recent_signal}\n"
        f"Asset to Offer: {give_first_asset}\n"
    )

    if req.custom_modifier:
        prompt += f"\nAdditional User Instructions (incorporate cleanly): {req.custom_modifier}\n"

    generated_text = ""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                    response_mime_type="application/json",
                    response_schema=OutreachDraft,
                )
            )
            if response.text:
                parsed_data = json.loads(response.text)
                subject = parsed_data.get("subject", "").strip()
                body = parsed_data.get("body", "").strip()
                if req.channel == 'email' and subject:
                    generated_text = f"Subject: {subject}\n\n{body}"
                else:
                    generated_text = body
        except Exception as e:
            print(f"Gemini API Error: {e}")
    
    if not generated_text:
        first_name = lead["name"].split(' ')[0]
        fallback_template = segment_config["email_fallback"] if req.channel == 'email' else segment_config["dm_fallback"]
        generated_text = fallback_template.format(first_name=first_name, asset=give_first_asset)

    if "drafts" not in lead:
        lead["drafts"] = {"email": "", "linkedin": "", "x": ""}
    lead["drafts"][req.channel] = generated_text
    lead["history"].append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": "generated",
        "channel": req.channel,
        "content": generated_text
    })
    if lead["status"] == "Ready":
        lead["status"] = "DM Drafted"
    save_leads(leads)
    return {"generated_text": generated_text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)