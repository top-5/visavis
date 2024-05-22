import { x64 } from 'murmurhash3js';

export function generateUuid(url: string): string {
    const hash = x64.hash128(url);
    return [
        hash.substring(0, 8),
        hash.substring(8, 12),
        '5' + hash.substring(13, 16),
        (parseInt(hash.substring(16, 17), 16) & 0x3 | 0x8).toString(16) + hash.substring(17, 20),
        hash.substring(20, 32)
    ].join('-');
}

export interface AnimationMotion {
    motion_id: string;
    product_id: string;
    name: string;
}

export interface Thumbnails {
    [key: string]: string;
}

export interface AnimationItem {
    // Mixamo Batcher attributes
    id: string;
    type: string;
    description: string;
    category: string;
    character_type: string;
    name: string;
    thumbnail?: string;
    thumbnail_animated: string;
    motion_id: string;
    motions: AnimationMotion[] | null | undefined;
    source: string;
    // Additional attributes
    url?: string;
    tags?: string;
}

export async function loadAnimationDictionary(url: string): Promise<AnimationItem[]> {
    const response = await fetch(url);
    const data = await response.json();
    if (data) {
        if (data.results && Array.isArray(data.results)) {
            return data.results;
        }
        if (Array.isArray(data)) {
            return data;
        }
    }
    console.error('Failed to load animation dictionary');
    return [];
}

export async function loadThumbnails(url: string): Promise<Thumbnails> {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

export async function findByTag(tag: string, items: AnimationItem[]): Promise<AnimationItem[]> {
    return items.filter((item) => {
        return item.tags?.includes(tag);
    });
}

export async function findByName(name: string, items: AnimationItem[]): Promise<AnimationItem | undefined> {
    return items.find((item) => item.name === name);
}

export async function findByAny(search: string, items: AnimationItem[]): Promise<AnimationItem[]> {
    return items.filter((item) => {
        return item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()) || item.tags?.toLowerCase().includes(search.toLowerCase());
    });
}

export async function findById(id: string, items: AnimationItem[]): Promise<AnimationItem | undefined> {
    return items.find((item) => item.id === id);
}

export function populateThumbnails(items: AnimationItem[], thumbnails: Thumbnails): AnimationItem[] {
    const keys = Object.keys(thumbnails);

    keys.forEach((key) => {
        // Thumbnail contains action name and extension. Action name uses %20 for space. Extract action name without extension.
        const thumbnail = thumbnails[key];
        let url = thumbnail;
        let action = decodeURIComponent(url);
        action = action.split('/').pop()!.split('.').shift()!;
        items.filter((item) => {
            if (item.name === action) {                
                item.thumbnail_animated = '/animations/' + encodeURIComponent(action) + '.webm';
            }
        });
    });
    return items;
}

function addTag(item: AnimationItem, tag: string): AnimationItem {
    if (!item.tags) {
        item.tags = tag;
    } else {
        item.tags += ` ${tag}`;
    }
    return item;
}

export function fixMetadata(items: AnimationItem[]): AnimationItem[] {
    items.forEach((item) => {
        if (!item.type) {
            item.type = 'Motion';
        }
        if (item.url?.includes('readyplayerme')) {
            item.source = 'RPM';
        } else
        if (item.source === 'system') {
            item.source = 'Mixamo';
        }
        if (!item.character_type) {
            item.type = 'human';
        }
        if (!item.id) {
            item.id = generateUuid(item.url ?? item.name);
            item.motion_id = item.id;
        }
        if (item.name.startsWith('F_')) {
            addTag(item, 'Female');
        }
        if (item.name.startsWith('M_')) {
            addTag(item, 'Male');
        }
        if (item.source === 'Mixamo') {
            item.url = encodeURI('/animations/' + item.name + '.fbx');
        }
        // Generate tags based on name and description
        const newTags = new Set([...item.name.split(/\W+/), ...item.description.split(/\W+/)]);
        newTags.forEach((tag) => {
            addTag(item, tag);
        });
        // Remove empty thumbnails
        if (item.thumbnail == null || item.thumbnail === '') {
            delete item.thumbnail;
        }

    });
    items = addCategories(items);
    return items;
}

type AnimationItemArray = AnimationItem[];

function EmptyAnimationItemArray(): AnimationItemArray {
    return [];
}

interface Category {
    [key: string]: AnimationItemArray;
}

interface Categories {
    [key: string]: Category;
}

export const categoryTree: Categories = {
    General: {
        Idle: EmptyAnimationItemArray(),
        Moving: EmptyAnimationItemArray(),
        Jumping: EmptyAnimationItemArray(),
        Dancing: EmptyAnimationItemArray()
    },
    Combat: {
        Melee: EmptyAnimationItemArray(),
        Ranged: EmptyAnimationItemArray(),
        Unarmed: EmptyAnimationItemArray()
    },
    Expressions: {
        Emotes: EmptyAnimationItemArray(),
        Facial: EmptyAnimationItemArray(),
        Reactions: EmptyAnimationItemArray()
    },
    Interaction: {
        Tools: EmptyAnimationItemArray(),
        Social: EmptyAnimationItemArray()
    },
    Special: {
        Sports: EmptyAnimationItemArray(),
        Fantasy: EmptyAnimationItemArray(),
        Poses: EmptyAnimationItemArray()
    },
    Packs: {
        Various: EmptyAnimationItemArray()
    }
};

// Mapping keywords to categories
const defaultCategoryMap: { [key: string]: [keyof Categories, string] } = {
    // General Actions
    Idle: ['General', 'Idle'],
    Walk: ['General', 'Moving'],
    Run: ['General', 'Moving'],
    Jump: ['General', 'Jumping'],
    Dance: ['General', 'Dancing'],
    Dancing: ['General', 'Dancing'],

    // Combat
    Sword: ['Combat', 'Melee'],
    Axe: ['Combat', 'Melee'],
    Melee: ['Combat', 'Melee'],
    Bow: ['Combat', 'Ranged'],
    Rifle: ['Combat', 'Ranged'],
    Gun: ['Combat', 'Ranged'],
    Punch: ['Combat', 'Unarmed'],
    Kick: ['Combat', 'Unarmed'],

    // Expressions & Gestures
    Taunt: ['Expressions', 'Emotes'],
    Cheer: ['Expressions', 'Emotes'],
    Point: ['Expressions', 'Emotes'],
    Facial: ['Expressions', 'Facial'],
    Expression: ['Expressions', 'Facial'],
    Reaction: ['Expressions', 'Reactions'],

    // Interaction
    Tool: ['Interaction', 'Tools'],
    Weapon: ['Interaction', 'Tools'],
    Kiss: ['Interaction', 'Social'],
    Shake: ['Interaction', 'Social'],

    // Special Movement
    Soccer: ['Special', 'Sports'],
    Acrobatic: ['Special', 'Sports'],
    Capoeira: ['Special', 'Sports'],
    Zombie: ['Special', 'Fantasy'],
    Mutant: ['Special', 'Fantasy'],
    Pose: ['Special', 'Poses'],
    Static: ['Special', 'Poses']
};

// Function to categorize animations using the dictionary lookup
export function addCategories(animations: AnimationItem[]): AnimationItem[] {
    animations.forEach((animation) => {
        const { type, name, description } = animation;

        if (type === 'MotionPack') {
            animation.category = 'Packs Various';
        } else {
            // Find a matching keyword in the category map
            const keyword = Object.keys(defaultCategoryMap).find(
                (key) => name.includes(key) || description.includes(key)
            );
            if (keyword) {
                const [category, subcategory] = defaultCategoryMap[keyword];
                animation.category = `${category} ${subcategory}`;
            }
        }
    });
    return animations;
}

// Function to categorize animations using the dictionary lookup
export function categorizeAnimations(animations: AnimationItem[]): Categories {
    animations.forEach((animation) => {
        const { type, name, description } = animation;

        if (type === 'MotionPack') {
            categoryTree.Packs.Various.push(animation);
        } else {
            // Find a matching keyword in the category map
            const keyword = Object.keys(defaultCategoryMap).find(
                (key) => name.includes(key) || description.includes(key)
            );
            if (keyword) {
                const [category, subcategory] = defaultCategoryMap[keyword];
                categoryTree[category][subcategory].push(animation);
            }
        }
    });
    return categoryTree;
}

export function findBestMatchForVoiceCommand(command: string, items: AnimationItem[]): AnimationItem | undefined {
    command = command.toLowerCase();
    const matches = items.filter((item) => {
        if (item.name.toLowerCase().includes(command))
            return true;
        if (item.description.toLowerCase().includes(command))
            return true;
        if (item.tags?.toLowerCase().includes(command))
            return true;
        if (item.category.toLowerCase().includes(command))
            return true;
        // Now try to split the command into words and see if any of them match
        const words = command.split(' ');
        for (const word of words) {
            if (item.name.toLowerCase().includes(word))
                return true;
            if (item.description.toLowerCase().includes(word))
                return true;
            if (item.tags?.toLowerCase().includes(word))
                return true;
            if (item.category.toLowerCase().includes(word))
                return true;
        }
        return false;
    });
    
    if (matches.length > 0) {
        return matches[0];
    }
    return undefined;
}