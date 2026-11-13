"""Which offered repositories are archived (GitHub GraphQL API, cached)."""

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_card.archived import GRAPHQL_URL, async_archived, build_query, parse


def test_query_quotes_names():
    query = build_query(["juju35/ha-parcel", 'a/b"c'])
    assert 'r0: repository(owner: "juju35", name: "ha-parcel") { nameWithOwner isArchived }' in query
    assert 'name: "b\\"c"' in query


def test_parse_by_position():
    data = {"r0": {"nameWithOwner": "juju35/new-name", "isArchived": True}, "r1": {"isArchived": False}, "r2": None}
    assert parse(["juju35/Old-Name", "a/b", "gone/repo"], data) == {"juju35/old-name"}


async def test_archived_cached_and_errors(hass, aioclient_mock):
    gh = MockConfigEntry(domain="github", data={"access_token": "tok"})
    gh.add_to_hass(hass)
    aioclient_mock.post(
        GRAPHQL_URL,
        json={"data": {"r0": {"nameWithOwner": "a/b", "isArchived": True}, "r1": {"isArchived": False}}},
    )
    assert await async_archived(hass, gh, ["c/d", "a/b", "not a name"]) == {"a/b"}
    assert aioclient_mock.mock_calls[0][3]["Authorization"] == "Bearer tok"
    assert await async_archived(hass, gh, ["a/b", "c/d"]) == {"a/b"}
    assert aioclient_mock.call_count == 1  # cached
    assert await async_archived(hass, gh, []) == set()

    aioclient_mock.clear_requests()
    aioclient_mock.post(GRAPHQL_URL, status=502)
    assert await async_archived(hass, gh, ["e/f"]) is None


async def test_archived_without_token(hass):
    gh = MockConfigEntry(domain="github", data={})
    gh.add_to_hass(hass)
    assert await async_archived(hass, gh, ["a/b"]) is None
