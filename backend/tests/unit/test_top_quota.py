from valostats.constants.top_collection import MATCHES_PER_MAP
from valostats.ingestion.top_quota import OTHERS_PER_MAP, TopQuota

POOL = frozenset({"Ascent", "Lotus"})


def test_a_full_map_refuses_new_matches():
    quota = TopQuota(patch="13.06")
    quota.stored["Ascent"] = MATCHES_PER_MAP
    assert not quota.accepts("13.06", "Ascent", "eu")
    assert quota.accepts("13.06", "Lotus", "eu")


def test_other_regions_only_fill_what_eu_leaves():
    quota = TopQuota(patch="13.06")
    for _ in range(OTHERS_PER_MAP):
        quota.add("Ascent", "na")
    assert not quota.accepts("13.06", "Ascent", "kr")
    assert quota.accepts("13.06", "Ascent", "eu")


def test_older_patches_are_not_collected():
    quota = TopQuota(patch="13.06")
    assert not quota.accepts("13.05", "Ascent", "eu")


def test_a_new_patch_opens_a_fresh_quota():
    quota = TopQuota(patch="13.06")
    quota.stored["Ascent"] = MATCHES_PER_MAP
    quota.see("13.07")
    assert quota.patch == "13.07"
    assert quota.accepts("13.07", "Ascent", "eu")
    assert not quota.accepts("13.06", "Lotus", "eu")


def test_patches_compare_as_numbers():
    quota = TopQuota(patch="13.09")
    quota.see("13.10")
    assert quota.patch == "13.10"


def test_full_once_every_pool_map_is_full_for_the_region():
    quota = TopQuota(patch="13.06")
    quota.stored["Ascent"] = MATCHES_PER_MAP
    quota.others["Lotus"] = OTHERS_PER_MAP
    assert quota.full(POOL, "na")
    assert not quota.full(POOL, "eu")
    quota.stored["Lotus"] = MATCHES_PER_MAP
    assert quota.full(POOL, "eu")


def test_never_full_without_a_pool_or_a_patch():
    assert not TopQuota(patch="13.06").full(frozenset(), "eu")
    assert not TopQuota(patch=None).full(POOL, "eu")
