"""Agents and their roles, as the squad names them."""

# Henrik agent name -> role. Update after a patch that adds an agent.
AGENT_ROLES: dict[str, str] = {
    "Astra": "Controller",
    "Breach": "Initiator",
    "Brimstone": "Controller",
    "Chamber": "Sentinel",
    "Clove": "Controller",
    "Cypher": "Sentinel",
    "Deadlock": "Sentinel",
    "Fade": "Initiator",
    "Gekko": "Initiator",
    "Harbor": "Controller",
    "Iso": "Duelist",
    "Jett": "Duelist",
    "KAY/O": "Initiator",
    "Killjoy": "Sentinel",
    "Miks": "Controller",
    "Neon": "Duelist",
    "Omen": "Controller",
    "Phoenix": "Duelist",
    "Raze": "Duelist",
    "Reyna": "Duelist",
    "Sage": "Sentinel",
    "Skye": "Initiator",
    "Sova": "Initiator",
    "Tejo": "Initiator",
    "Veto": "Sentinel",
    "Viper": "Controller",
    "Vyse": "Sentinel",
    "Waylay": "Duelist",
    "Yoru": "Duelist",
}

# Role of an agent missing from the table above.
UNKNOWN_ROLE = "Unknown"

ROLE_LABELS: dict[str, str] = {
    "Duelist": "Duelliste",
    "Initiator": "Initiateur",
    "Controller": "Contrôleur",
    "Sentinel": "Sentinelle",
    UNKNOWN_ROLE: "Rôle inconnu",
}


def canonical_agent(name: str | None) -> str | None:
    """Agent name as Henrik spells it ('neon' -> 'Neon'), `None` for an unknown one ('default')."""
    wanted = (name or "").strip().lower()
    return next((agent for agent in AGENT_ROLES if agent.lower() == wanted), None)


def role_of(agent: str | None) -> str:
    """Role of an agent, `UNKNOWN_ROLE` for a new or missing one."""
    return AGENT_ROLES.get(agent or "", UNKNOWN_ROLE)
