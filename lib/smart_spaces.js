/**
 * Auto-organize saved items into platform Spaces (YouTube, Instagram, Facebook, etc.)
 */

const SMART_SPACE_DEFS = {
    youtube: { name: 'YouTube' },
    instagram: { name: 'Instagram' },
    facebook: { name: 'Facebook' },
    tiktok: { name: 'TikTok' },
    twitter: { name: 'Twitter / X' },
    linkedin: { name: 'LinkedIn' },
    gallery: { name: 'Gallery' },
    notes: { name: 'Notes' },
    links: { name: 'Links' },
};

const spaceIdCache = new Map();

function normalizeUrl(url) {
    const raw = (url || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
}

export function detectSmartSpaceKey(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return 'notes';
    }

    const normalized = normalizeUrl(url);
    const lower = normalized.toLowerCase();
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';

    try {
        const host = new URL(normalized).hostname.toLowerCase();

        if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
        if (host.includes('instagram.com')) return 'instagram';
        if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
        if (host.includes('tiktok.com')) return 'tiktok';
        if (host.includes('twitter.com') || host === 'x.com' || host.endsWith('.x.com')) return 'twitter';
        if (host.includes('linkedin.com')) return 'linkedin';

        // ImgBB / direct image hosts from uploads
        if (host.includes('ibb.co') || host.includes('imgbb.com') || host.includes('i.ibb.co')) {
            return 'gallery';
        }

        return 'links';
    } catch {
        return 'links';
    }
}

export async function resolveSmartSpaceId(supabase, options = {}) {
    const key = options.type || detectSmartSpaceKey(options.url);
    const def = SMART_SPACE_DEFS[key];
    if (!def) return null;

    if (spaceIdCache.has(key)) return spaceIdCache.get(key);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // Use limit(1) — maybeSingle() fails when duplicate folders share the same name
    const { data: existingList, error: findError } = await supabase
        .from('spaces')
        .select('id')
        .eq('user_id', user.id)
        .is('parent_id', null)
        .eq('name', def.name)
        .order('created_at', { ascending: true })
        .limit(1);

    if (findError) {
        console.warn('Smart spaces lookup failed:', findError.message);
        return null;
    }

    const existing = existingList?.[0];
    if (existing?.id) {
        spaceIdCache.set(key, existing.id);
        return existing.id;
    }

    const { data: created, error: createError } = await supabase
        .from('spaces')
        .insert({
            name: def.name,
            parent_id: null,
            user_id: user.id,
        })
        .select('id')
        .single();

    if (createError) {
        console.warn('Smart spaces create failed:', createError.message);
        return null;
    }

    spaceIdCache.set(key, created.id);
    return created.id;
}

/** Merge space_id (+ user_id) into a mind_links insert payload when possible */
export async function withSmartSpace(supabase, record, options = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...record };
    if (user && !payload.user_id) payload.user_id = user.id;

    const url = options.url ? normalizeUrl(options.url) : options.url;
    const spaceId = await resolveSmartSpaceId(supabase, { ...options, url });
    if (spaceId) payload.space_id = spaceId;
    return payload;
}

/** Move existing links (space_id null) into the right smart folder */
export async function backfillSmartSpaces(supabase) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data: links, error } = await supabase
        .from('mind_links')
        .select('id, url, note')
        .is('space_id', null)
        .limit(200);

    if (error || !links?.length) return;

    for (const link of links) {
        const type = !link.url || link.url.trim() === ''
            ? 'notes'
            : null;
        const spaceId = await resolveSmartSpaceId(
            supabase,
            type ? { type } : { url: link.url }
        );
        if (!spaceId) continue;

        await supabase
            .from('mind_links')
            .update({ space_id: spaceId })
            .eq('id', link.id);
    }
}

/** Pre-create default smart folders on Spaces screen */
export async function ensureSmartSpaces(supabase) {
    const keys = ['youtube', 'instagram', 'facebook', 'gallery', 'notes', 'links'];
    for (const type of keys) {
        await resolveSmartSpaceId(supabase, { type });
    }
    await backfillSmartSpaces(supabase);
}
