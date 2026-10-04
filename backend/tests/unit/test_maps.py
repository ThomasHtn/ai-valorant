"""Minimap orientation of a map from its spawn callouts."""

from valostats.domain.maps import Callout, GameMap


def game_map(attack: tuple[float, float], defense: tuple[float, float]) -> GameMap:
    """Identity-like projection: game y gives image x, game x gives image y."""
    callouts = (Callout("Attacker Side Spawn", *attack), Callout("Defender Side Spawn", *defense))
    return GameMap("Test", "", 1.0, 1.0, 0.0, 0.0, callouts)


def test_attackers_already_at_the_bottom_need_no_turn() -> None:
    # Game (x, y) -> image (y, x): attackers at image (0.5, 0.9), defenders at (0.5, 0.1).
    assert game_map((0.9, 0.5), (0.1, 0.5)).attack_up_rotation() == 0


def test_attackers_on_the_right_turn_a_quarter_clockwise() -> None:
    assert game_map((0.5, 0.9), (0.5, 0.1)).attack_up_rotation() == 90


def test_attackers_on_the_left_turn_a_quarter_anticlockwise() -> None:
    assert game_map((0.5, 0.1), (0.5, 0.9)).attack_up_rotation() == 270


def test_no_spawn_callouts_keep_the_image_as_is() -> None:
    assert GameMap("Test", "", 1.0, 1.0, 0.0, 0.0, ()).attack_up_rotation() == 0
