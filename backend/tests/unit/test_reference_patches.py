from valostats.analysis.report.foundation.reference_patches import reference_patches
from valostats.constants.report import REFERENCE_MIN_MATCHES


def test_a_period_is_compared_with_its_own_patch():
    top = {"13.06": REFERENCE_MIN_MATCHES, "13.07": REFERENCE_MIN_MATCHES}
    assert reference_patches({"13.07"}, top) == ("13.07",)


def test_a_thin_new_patch_is_completed_by_the_previous_one():
    top = {"13.06": 2800, "13.07": REFERENCE_MIN_MATCHES - 1}
    assert reference_patches({"13.07"}, top) == ("13.06", "13.07")


def test_a_period_older_than_the_kept_patches_uses_them_all():
    assert reference_patches({"12.10"}, {"13.06": 2800, "13.07": 2800}) == ("13.06", "13.07")


def test_a_period_across_two_patches_keeps_both():
    top = {"13.06": 500, "13.07": 500}
    assert reference_patches({"13.06", "13.07"}, top) == ("13.06", "13.07")
