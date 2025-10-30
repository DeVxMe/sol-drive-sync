export const SOLDRIVE_IDL = {
  "address": "CxDoRt3Nt5z747KNW6vkVxvQQ7c2dHMmGmoWNmxejA3f",
  "metadata": {
    "name": "soldrive",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "create_file",
      "discriminator": [98, 191, 1, 17, 32, 12, 160, 31],
      "accounts": [
        {
          "name": "file_record",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [102, 105, 108, 101] },
              { "kind": "account", "path": "owner" },
              { "kind": "arg", "path": "file_name" }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }]
          }
        },
        {
          "name": "user_profile",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [117, 115, 101, 114, 95, 112, 114, 111, 102, 105, 108, 101] },
              { "kind": "account", "path": "owner" }
            ]
          }
        },
        { "name": "owner", "writable": true, "signer": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "file_name", "type": "string" },
        { "name": "file_size", "type": "u64" },
        { "name": "file_hash", "type": { "array": ["u8", 32] } },
        { "name": "chunk_count", "type": "u32" },
        { "name": "timestamp", "type": "i64" }
      ]
    },
    {
      "name": "create_user_profile",
      "discriminator": [9, 214, 142, 184, 153, 65, 50, 174],
      "accounts": [
        {
          "name": "user_profile",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [117, 115, 101, 114, 95, 112, 114, 111, 102, 105, 108, 101] },
              { "kind": "account", "path": "user" }
            ]
          }
        },
        { "name": "user", "writable": true, "signer": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "finalize_file",
      "discriminator": [232, 50, 209, 57, 223, 158, 6, 250],
      "accounts": [
        { "name": "file_record", "writable": true },
        { "name": "owner", "signer": true, "relations": ["file_record"] }
      ],
      "args": []
    },
    {
      "name": "grant_access",
      "discriminator": [66, 88, 87, 113, 39, 22, 27, 165],
      "accounts": [
        {
          "name": "shared_access",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [115, 104, 97, 114, 101, 100, 95, 97, 99, 99, 101, 115, 115] },
              { "kind": "account", "path": "file_record" },
              { "kind": "arg", "path": "shared_with" }
            ]
          }
        },
        { "name": "file_record" },
        { "name": "owner", "writable": true, "signer": true, "relations": ["file_record"] },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "shared_with", "type": "pubkey" },
        { "name": "access_level", "type": { "defined": { "name": "AccessLevel" } } },
        { "name": "expires_at", "type": { "option": "i64" } }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [175, 175, 109, 31, 13, 152, 155, 237],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }]
          }
        },
        { "name": "authority", "writable": true, "signer": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "make_private",
      "discriminator": [24, 194, 92, 182, 123, 211, 83, 22],
      "accounts": [
        { "name": "file_record", "writable": true },
        { "name": "owner", "signer": true, "relations": ["file_record"] }
      ],
      "args": []
    },
    {
      "name": "make_public",
      "discriminator": [41, 76, 102, 98, 184, 102, 132, 29],
      "accounts": [
        { "name": "file_record", "writable": true },
        { "name": "owner", "signer": true, "relations": ["file_record"] }
      ],
      "args": []
    },
    {
      "name": "register_storage",
      "discriminator": [187, 25, 191, 153, 224, 247, 4, 97],
      "accounts": [
        { "name": "file_record", "writable": true },
        { "name": "owner", "signer": true, "relations": ["file_record"] }
      ],
      "args": [
        { "name": "primary_storage", "type": "string" },
        { "name": "merkle_root", "type": { "array": ["u8", 32] } }
      ]
    },
    {
      "name": "revoke_access",
      "discriminator": [106, 128, 38, 169, 103, 238, 102, 147],
      "accounts": [
        { "name": "shared_access", "writable": true },
        { "name": "file_record", "relations": ["shared_access"] },
        { "name": "owner", "signer": true, "relations": ["shared_access"] }
      ],
      "args": []
    }
  ],
  "types": [
    {
      "name": "AccessLevel",
      "type": {
        "kind": "enum",
        "variants": [{ "name": "Read" }, { "name": "Write" }, { "name": "Admin" }]
      }
    },
    {
      "name": "FileStatus",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "Uploading" },
          { "name": "Processing" },
          { "name": "Active" },
          { "name": "Archived" },
          { "name": "Deleted" }
        ]
      }
    }
  ]
} as const;

export type SoldriveIDL = typeof SOLDRIVE_IDL;
