module chat_app::chat_contract {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{String};
    use std::vector;
    use sui::event;
    use sui::clock::{Self, Clock};

    // ========== Structs ==========

    public struct Profile has key, store {
        id: UID,
        username: String,
        avatar_url: String,
        owner: address
    }

    public struct ChatRoom has key {
        id: UID,
        messages: vector<Message> 
    }

    public struct Message has store, copy, drop {
        sender: address,
        text: String,
        timestamp: u64
    }

    public struct MessagePosted has copy, drop {
        sender: address,
        text: String,
        timestamp: u64
    }

    public struct ProfileUpdated has copy, drop {
        owner: address,
        username: String,
        avatar_url: String
    }

    // ========== Functions ==========

    fun init(ctx: &mut TxContext) {
        let chat_room = ChatRoom {
            id: object::new(ctx),
            messages: vector::empty()
        };
        transfer::share_object(chat_room);
    }

    // 注意：這裡移除了 'entry' 關鍵字，只保留 'public'
    public fun create_profile(
        username: String,
        avatar_url: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let profile = Profile {
            id: object::new(ctx),
            username: username,
            avatar_url: avatar_url,
            owner: sender
        };

        event::emit(ProfileUpdated {
            owner: sender,
            username: username,
            avatar_url: avatar_url
        });

        transfer::transfer(profile, sender);
    }

    // 注意：這裡移除了 'entry' 關鍵字
    public fun update_profile(
        profile: &mut Profile,
        new_username: String,
        new_avatar_url: String,
        _ctx: &mut TxContext
    ) {
        profile.username = new_username;
        profile.avatar_url = new_avatar_url;

        event::emit(ProfileUpdated {
            owner: profile.owner,
            username: new_username,
            avatar_url: new_avatar_url
        });
    }

    // 注意：這裡移除了 'entry' 關鍵字
    public fun send_message(
        room: &mut ChatRoom, 
        text: String, 
        clock: &Clock, 
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let msg = Message {
            sender: sender,
            text: text,
            timestamp: timestamp
        };

        vector::push_back(&mut room.messages, msg);

        event::emit(MessagePosted {
            sender: sender,
            text: text,
            timestamp: timestamp
        });
    }
}