module overmind::pay_me_a_river {
    //==============================================================================================
    // Dependencies
    //==============================================================================================
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::account;
    use std::table::{Self, Table};
    use aptos_framework::timestamp;
    use std::simple_map::{Self, SimpleMap};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;


    //==============================================================================================
    // Error codes - DO NOT MODIFY
    //==============================================================================================
    const ESenderCanNotBeReceiver: u64 = 1;
    const ENumberInvalid: u64 = 2;
    const EStreamStoreDoesNotExist: u64 = 3;
    const EStreamDoesNotExist: u64 = 4;
    const EStreamIsActive: u64 = 5;
    const ESignerIsNotSenderOrReceiver: u64 = 6;

    //==============================================================================================
    // Module Structs - DO NOT MODIFY
    //==============================================================================================
    struct Stream has store {
        id: u64,
        sender: address,
        receiver: address,
        duration_in_seconds: u64,
        start_timestamp_seconds: u64,
        coins: Coin<AptosCoin>,
    }

    struct StreamStore has key {
        streams: SimpleMap<address, Stream>,
    }

    struct StreamReceiverLookup has key {
        senders_for_receiver: Table<address, vector<address>>,
    }

    struct StreamCounter has key {
        counter: u64,
    }

    struct ModuleEventStore has key {
        stream_create_events: event::EventHandle<StreamCreateEvent>,
        stream_accept_events: event::EventHandle<StreamAcceptEvent>,
        stream_claim_events: event::EventHandle<StreamClaimEvent>,
        stream_close_events: event::EventHandle<StreamCloseEvent>,
    }

    //==============================================================================================
    // Event structs - DO NOT MODIFY
    // 
    // Note for dev (delete before deployment): 
    //     - Use header comments for structs and line comments for struct fields
    //     - Use PascalCase for struct names
    //     - Start event description with "Event to be emitted when"
    //==============================================================================================

    struct StreamCreateEvent has store, drop {
        // address of the stream sender
        sender_address: address,
        // address of the stream receiver
        receiver_address: address,
        // amount of coins to be streamed
        amount: u64,
        // duration of the stream in seconds
        duration_in_seconds: u64,
        // id of the stream
        stream_id: u64,
        // Timestamp of the stream creation
        timestamp: u64,
    }

    struct StreamAcceptEvent has store, drop {
        // address of the stream sender
        sender_address: address,
        // address of the stream receiver
        receiver_address: address,
        // id of the stream
        stream_id: u64,
        // Timestamp of the stream acceptance
        timestamp: u64,
    }

    struct StreamClaimEvent has store, drop {
        // address of the stream sender
        sender_address: address,
        // address of the stream receiver
        receiver_address: address,
        // amount of coins claimed
        amount: u64,
        // id of the stream
        stream_id: u64,
        // Timestamp of the stream claim
        timestamp: u64,
    }

    struct StreamCloseEvent has store, drop {
        // address of the stream sender
        sender_address: address,
        // address of the stream receiver
        receiver_address: address,
        // amount of coins claimed
        amount_to_receiver: u64,
        // amount of coins returned to the sender
        amount_to_sender: u64,
        // id of the stream
        stream_id: u64,
        // Timestamp of the stream claim
        timestamp: u64,
    }

    fun init_module(admin: &signer) {
        let receiver_lookup = StreamReceiverLookup {
            senders_for_receiver: table::new(),
        };
        move_to(admin, receiver_lookup);

        let stream_counter = StreamCounter { counter: 0 };
        move_to(admin, stream_counter);

        let module_event_store = ModuleEventStore {
            stream_create_events: account::new_event_handle(admin),
            stream_accept_events: account::new_event_handle(admin),
            stream_claim_events: account::new_event_handle(admin),
            stream_close_events: account::new_event_handle(admin),
        };
        move_to(admin, module_event_store);
    }

    public entry fun create_stream(
        creator: &signer,
        receiver_address: address,
        amount: u64,
        duration_in_seconds: u64
    ) acquires StreamStore, StreamReceiverLookup, StreamCounter, ModuleEventStore {
        let creator_address = signer::address_of(creator);
        check_sender_is_not_receiver(creator_address, receiver_address);
        check_number_is_valid(amount);
        check_number_is_valid(duration_in_seconds);
        if (!exists<StreamStore>(creator_address)) {
            let payments = StreamStore {
                streams: simple_map::create(),
            };
            move_to(creator, payments);
        };
        let stream_store = borrow_global_mut<StreamStore>(creator_address);
        assert!(
            !simple_map::contains_key(&stream_store.streams, &receiver_address),
            0
        );
        let stream_counter = borrow_global_mut<StreamCounter>(@overmind);
        let stream_id = stream_counter.counter;
        let stream = Stream {
            id: stream_id,
            sender: creator_address,
            receiver: receiver_address,
            duration_in_seconds,
            start_timestamp_seconds: 0,
            coins: coin::withdraw<AptosCoin>(creator, amount),
        };
        simple_map::add(&mut stream_store.streams, receiver_address, stream);
        stream_counter.counter = stream_counter.counter + 1;

        let receiver_lookup = borrow_global_mut<StreamReceiverLookup>(@overmind);
        let senders = table::borrow_mut_with_default(&mut receiver_lookup.senders_for_receiver, receiver_address, vector[]);
        vector::push_back(senders, creator_address);

        event::emit_event(
            &mut borrow_global_mut<ModuleEventStore>(@overmind).stream_create_events,
            StreamCreateEvent {
                sender_address: creator_address,
                receiver_address,
                amount,
                duration_in_seconds,
                stream_id,
                timestamp: timestamp::now_seconds(),
            },
        );
    }

    public entry fun accept_stream(receiver: &signer, sender_address: address) acquires StreamStore, ModuleEventStore {
        check_stream_store_exists(sender_address);
        let payments = borrow_global_mut<StreamStore>(sender_address);
        let receiver_address = signer::address_of(receiver);
        check_stream_exists(payments, receiver_address);
        check_stream_is_not_active(payments, receiver_address);
        let stream = simple_map::borrow_mut(&mut payments.streams, &receiver_address);
        stream.start_timestamp_seconds = timestamp::now_seconds();

        event::emit_event(
            &mut borrow_global_mut<ModuleEventStore>(@overmind).stream_accept_events,
            StreamAcceptEvent {
                sender_address,
                receiver_address,
                stream_id: stream.id,
                timestamp: timestamp::now_seconds(),
            },
        );
    }

    public entry fun claim_stream(receiver: &signer, sender_address: address) acquires StreamStore, StreamReceiverLookup, ModuleEventStore {
        check_stream_store_exists(sender_address);
        let payments = borrow_global_mut<StreamStore>(sender_address);
        let receiver_address = signer::address_of(receiver);
        check_stream_exists(payments, receiver_address);
        let (_, Stream { id, coins, start_timestamp_seconds, receiver, sender, duration_in_seconds }) = 
            simple_map::remove(&mut payments.streams,&receiver_address);
        let claim_amount = calculate_stream_claim_amount(
            coin::value(&coins), 
            start_timestamp_seconds, 
            duration_in_seconds
        );
        if (coin::value(&coins) <= claim_amount) {
            let amount_to_receiver = coin::value(&coins);
            coin::deposit(receiver_address, coins);
            let receiver_lookup = borrow_global_mut<StreamReceiverLookup>(@overmind);
            let senders = table::borrow_mut(&mut receiver_lookup.senders_for_receiver, receiver_address);
            let (_, index) = vector::index_of(senders, &sender_address);
            vector::remove(senders, index);

            event::emit_event(
                &mut borrow_global_mut<ModuleEventStore>(@overmind).stream_close_events,
                StreamCloseEvent {
                    sender_address,
                    receiver_address,
                    amount_to_receiver,
                    amount_to_sender: 0,
                    stream_id: id,
                    timestamp: timestamp::now_seconds(),
                },
            );
        } else {
            coin::deposit(receiver, coin::extract(&mut coins, claim_amount));
            simple_map::add(
                &mut payments.streams, 
                receiver, 
                Stream {
                    id,
                    coins, 
                    start_timestamp_seconds: timestamp::now_seconds(), 
                    receiver, 
                    sender, 
                    duration_in_seconds: duration_in_seconds - (timestamp::now_seconds() - start_timestamp_seconds)
                }
            );

            event::emit_event(
                &mut borrow_global_mut<ModuleEventStore>(@overmind).stream_claim_events,
                StreamClaimEvent {
                    sender_address,
                    receiver_address,
                    amount: claim_amount,
                    stream_id: id,
                    timestamp: timestamp::now_seconds(),
                },
            );
        };
    }

    public entry fun cancel_stream(
        signer: &signer,
        sender_address: address,
        receiver_address: address
    ) acquires StreamStore, StreamReceiverLookup, ModuleEventStore {
        let signer_address = signer::address_of(signer);
        check_signer_address_is_sender_or_receiver(signer_address, sender_address, receiver_address);
        check_stream_store_exists(sender_address);
        let payments = borrow_global_mut<StreamStore>(sender_address);
        check_stream_exists(payments, receiver_address);
        let (_, Stream { id, coins, start_timestamp_seconds, receiver: _, sender: _, duration_in_seconds }) = simple_map::remove(
            &mut payments.streams,
            &receiver_address
        );
        if (start_timestamp_seconds == 0) { 
            let amount_to_sender = coin::value(&coins);
            coin::deposit(sender_address, coins);
            event::emit_event(
                &mut borrow_global_mut<ModuleEventStore>(@overmind).stream_close_events,
                StreamCloseEvent {
                    sender_address,
                    receiver_address,
                    amount_to_receiver: 0,
                    amount_to_sender,
                    stream_id: id,
                    timestamp: timestamp::now_seconds(),
                },
            );
        } else {
            let amount_to_receiver = calculate_stream_claim_amount(coin::value(&coins), start_timestamp_seconds, duration_in_seconds);
            coin::deposit(receiver_address, coin::extract(&mut coins, amount_to_receiver));
            let amount_to_sender = coin::value(&coins);
            coin::deposit(sender_address, coins);

            event::emit_event(
                &mut borrow_global_mut<ModuleEventStore>(@overmind).stream_close_events,
                StreamCloseEvent {
                    sender_address,
                    receiver_address,
                    amount_to_receiver,
                    amount_to_sender,
                    stream_id: id,
                    timestamp: timestamp::now_seconds(),
                },
            );
        };

        let receiver_lookup = borrow_global_mut<StreamReceiverLookup>(@overmind);
        let senders = table::borrow_mut(&mut receiver_lookup.senders_for_receiver, receiver_address);
        let (_, index) = vector::index_of(senders, &sender_address);
        vector::remove(senders, index);
    }
    
    #[view]
    public fun get_receivers_streams(receiver_address: address)
    : (vector<address>, vector<u64>, vector<u64>, vector<u64>, vector<u64>) 
    acquires StreamReceiverLookup, StreamStore { 
        let receiver_lookup = borrow_global<StreamReceiverLookup>(@overmind);
        let senders = table::borrow_with_default(
            &receiver_lookup.senders_for_receiver,
            receiver_address,
            &vector[]
        );

        let i = 0;
        let sender_addresses = vector[];
        let start_timestamp_seconds = vector[];
        let duration_in_seconds = vector[];
        let stream_amounts = vector[];
        let stream_ids = vector[];

        let number_streams = vector::length(senders);
        
        while (i < number_streams) {
            let sender_address = *vector::borrow(senders, i);

            let stream_store = borrow_global<StreamStore>(sender_address);
            let stream = simple_map::borrow(&stream_store.streams, &receiver_address);

            vector::push_back(&mut sender_addresses, sender_address);
            vector::push_back(&mut start_timestamp_seconds, stream.start_timestamp_seconds);
            vector::push_back(&mut duration_in_seconds, stream.duration_in_seconds);
            vector::push_back(&mut stream_amounts, coin::value(&stream.coins));
            vector::push_back(&mut stream_ids, stream.id);

            i = i + 1;
        };

        (sender_addresses, start_timestamp_seconds, duration_in_seconds, stream_amounts, stream_ids)
    }

    #[view]
    public fun get_senders_streams(sender_address: address)
    : (vector<address>, vector<u64>, vector<u64>, vector<u64>, vector<u64>)
    acquires StreamStore {
        if (!exists<StreamStore>(sender_address)) {
            return (vector[], vector[], vector[], vector[], vector[])
        };

        let stream_store = borrow_global<StreamStore>(sender_address);
        let streams = &stream_store.streams;
        let receivers = simple_map::keys(streams);

        let i = 0;
        let receiver_addresses = vector[];
        let start_timestamp_seconds = vector[];
        let duration_in_seconds = vector[];
        let stream_amounts = vector[];
        let stream_ids = vector[];
        let number_streams = simple_map::length(streams);

        while (i < number_streams) {
            let receiver_address = vector::borrow(&receivers, i);
            let stream = simple_map::borrow(streams, receiver_address);

            vector::push_back(&mut receiver_addresses, *receiver_address);
            vector::push_back(&mut start_timestamp_seconds, stream.start_timestamp_seconds);
            vector::push_back(&mut duration_in_seconds, stream.duration_in_seconds);
            vector::push_back(&mut stream_amounts, coin::value(&stream.coins));
            vector::push_back(&mut stream_ids, stream.id);

            i = i + 1;
        };

        (receiver_addresses, start_timestamp_seconds, duration_in_seconds, stream_amounts, stream_ids)
    }

    inline fun check_sender_is_not_receiver(sender: address, receiver: address) {
        assert!(sender != receiver, ESenderCanNotBeReceiver);
    }

    inline fun check_number_is_valid(number: u64) {
        assert!(number > 0, ENumberInvalid);
    }

    inline fun check_stream_store_exists(sender_address: address) {
        assert!(exists<StreamStore>(sender_address), EStreamStoreDoesNotExist);
    }

    inline fun check_stream_exists(payments: &StreamStore, stream_address: address) {
        assert!(simple_map::contains_key(&payments.streams, &stream_address), EStreamDoesNotExist);
    }

    inline fun check_stream_is_not_active(payments: &StreamStore, stream_address: address) {
        let start_timestamp_seconds = simple_map::borrow(&payments.streams, &stream_address).start_timestamp_seconds;
        assert!(start_timestamp_seconds == 0, EStreamIsActive);
    }

    inline fun check_signer_address_is_sender_or_receiver(
        signer_address: address,
        sender_address: address,
        receiver_address: address
    ) {
        assert!(
            signer_address == sender_address || signer_address == receiver_address,
            ESignerIsNotSenderOrReceiver
        );
    }

    inline fun calculate_stream_claim_amount(total_amount: u64, start_timestamp_seconds: u64, duration_in_seconds: u64): u64 {
        let now = timestamp::now_seconds();
        let end_time = start_timestamp_seconds + duration_in_seconds;
        if (now < end_time) {
            let seconds_elapsed = (now - start_timestamp_seconds);
            (seconds_elapsed * total_amount) / duration_in_seconds
        } else {
            total_amount
        }
    }
}