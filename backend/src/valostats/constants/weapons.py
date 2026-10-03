"""Weapons and armor as Henrik names them, grouped the way the buy menu shows them."""

# Weapon classes in buy menu order: (key, French label, Henrik weapon names).
WEAPON_CLASSES: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("pistols", "Pistolets", ("Classic", "Shorty", "Frenzy", "Ghost", "Bandit", "Sheriff")),
    ("smg", "SMG", ("Stinger", "Spectre")),
    ("shotguns", "Fusils à pompe", ("Bucky", "Judge")),
    ("rifles", "Fusils", ("Bulldog", "Guardian", "Phantom", "Vandal")),
    ("snipers", "Snipers", ("Marshal", "Outlaw", "Operator")),
    ("machine_guns", "Mitrailleuses", ("Ares", "Odin")),
)

# Every gun in buy menu order, and the class label of each one.
GUNS: tuple[str, ...] = tuple(w for _, _, weapons in WEAPON_CLASSES for w in weapons)
CLASS_OF_GUN: dict[str, str] = {w: label for _, label, weapons in WEAPON_CLASSES for w in weapons}
SIDEARMS: frozenset[str] = frozenset(WEAPON_CLASSES[0][2])

OPERATOR = "Operator"

# Kill buckets that are not a gun. Henrik leaves Chamber and Neon ultimates unnamed: they are abilities.
ABILITY_LABEL = "Compétences"
KNIFE_LABEL = "Couteau"
OTHER_LABEL = "Autres"

# Henrik armor names at the end of the buy phase; None means no armor.
HEAVY_ARMOR = "Heavy Armor"
LIGHT_ARMOR = "Light Armor"
REGEN_SHIELD = "Regen Shield"
# Armor choices offered on a pistol round: (key, French label, Henrik name).
PISTOL_ARMORS: tuple[tuple[str, str, str | None], ...] = (
    ("light", "Armure légère", LIGHT_ARMOR),
    ("regen", "Bouclier régénérant", REGEN_SHIELD),
    ("none", "Sans armure", None),
)
