/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/soldrive.json`.
 */
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
      "name": "createFile",
      "discriminator": [
        98,
        191,
        1,
        17,
        32,
        12,
        160,
        31
      ],
      "accounts": [
        {
          "name": "fileRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "fileName"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fileName",
          "type": "string"
        },
        {
          "name": "fileSize",
          "type": "u64"
        },
        {
          "name": "fileHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "chunkCount",
          "type": "u32"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "createUserProfile",
      "discriminator": [
        9,
        214,
        142,
        184,
        153,
        65,
        50,
        174
      ],
      "accounts": [
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "finalizeFile",
      "discriminator": [
        232,
        50,
        209,
        57,
        223,
        158,
        6,
        250
      ],
      "accounts": [
        {
          "name": "fileRecord",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "fileRecord"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "grantAccess",
      "discriminator": [
        66,
        88,
        87,
        113,
        39,
        22,
        27,
        165
      ],
      "accounts": [
        {
          "name": "sharedAccess",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  100,
                  95,
                  97,
                  99,
                  99,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "fileRecord"
              },
              {
                "kind": "arg",
                "path": "sharedWith"
              }
            ]
          }
        },
        {
          "name": "fileRecord"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "fileRecord"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sharedWith",
          "type": "pubkey"
        },
        {
          "name": "accessLevel",
          "type": {
            "defined": {
              "name": "accessLevel"
            }
          }
        },
        {
          "name": "expiresAt",
          "type": {
            "option": "i64"
          }
        }
      ]
    },
    {
      "name": "helloSoldrive",
      "discriminator": [
        181,
        147,
        37,
        131,
        169,
        157,
        119,
        90
      ],
      "accounts": [],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "makePrivate",
      "discriminator": [
        24,
        194,
        92,
        182,
        123,
        211,
        83,
        22
      ],
      "accounts": [
        {
          "name": "fileRecord",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "fileRecord"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "makePublic",
      "discriminator": [
        41,
        76,
        102,
        98,
        184,
        102,
        132,
        29
      ],
      "accounts": [
        {
          "name": "fileRecord",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "fileRecord"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "registerStorage",
      "discriminator": [
        187,
        25,
        191,
        153,
        224,
        247,
        4,
        97
      ],
      "accounts": [
        {
          "name": "fileRecord",
          "writable": true
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "fileRecord"
          ]
        }
      ],
      "args": [
        {
          "name": "primaryStorage",
          "type": "string"
        },
        {
          "name": "merkleRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "revokeAccess",
      "discriminator": [
        106,
        128,
        38,
        169,
        103,
        238,
        102,
        147
      ],
      "accounts": [
        {
          "name": "sharedAccess",
          "writable": true
        },
        {
          "name": "fileRecord",
          "relations": [
            "sharedAccess"
          ]
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "sharedAccess"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fileRecord",
      "discriminator": [
        112,
        46,
        49,
        238,
        12,
        221,
        189,
        126
      ]
    },
    {
      "name": "sharedAccess",
      "discriminator": [
        133,
        221,
        251,
        154,
        37,
        64,
        34,
        178
      ]
    },
    {
      "name": "solDriveConfig",
      "discriminator": [
        91,
        100,
        241,
        146,
        103,
        212,
        61,
        59
      ]
    },
    {
      "name": "userProfile",
      "discriminator": [
        32,
        37,
        119,
        205,
        179,
        180,
        13,
        194
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "fileNameTooLong",
      "msg": "File name is too long (max 50 characters)"
    },
    {
      "code": 6001,
      "name": "invalidFileSize",
      "msg": "Invalid file size"
    },
    {
      "code": 6002,
      "name": "invalidChunkCount",
      "msg": "Invalid chunk count"
    },
    {
      "code": 6003,
      "name": "storageLocationTooLong",
      "msg": "Storage location string is too long (max 100 characters)"
    },
    {
      "code": 6004,
      "name": "storageLocationEmpty",
      "msg": "Storage location cannot be empty"
    },
    {
      "code": 6005,
      "name": "invalidFileStatus",
      "msg": "Invalid file status for this operation"
    },
    {
      "code": 6006,
      "name": "noStorageLocation",
      "msg": "No storage location registered"
    },
    {
      "code": 6007,
      "name": "fileNotActive",
      "msg": "File must be active to share"
    },
    {
      "code": 6008,
      "name": "invalidExpirationTime",
      "msg": "Expiration time must be in the future"
    }
  ],
  "types": [
    {
      "name": "accessLevel",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "read"
          },
          {
            "name": "write"
          },
          {
            "name": "admin"
          }
        ]
      }
    },
    {
      "name": "fileRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "fileName",
            "type": "string"
          },
          {
            "name": "fileSize",
            "type": "u64"
          },
          {
            "name": "fileHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "chunkCount",
            "type": "u32"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "primaryStorage",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "fileStatus"
              }
            }
          },
          {
            "name": "isPublic",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "fileStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "uploading"
          },
          {
            "name": "processing"
          },
          {
            "name": "active"
          },
          {
            "name": "archived"
          },
          {
            "name": "deleted"
          }
        ]
      }
    },
    {
      "name": "sharedAccess",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fileRecord",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "sharedWith",
            "type": "pubkey"
          },
          {
            "name": "accessLevel",
            "type": {
              "defined": {
                "name": "accessLevel"
              }
            }
          },
          {
            "name": "expiresAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "solDriveConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalFiles",
            "type": "u64"
          },
          {
            "name": "storageFeePerGb",
            "type": "u64"
          },
          {
            "name": "maxFileSize",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "filesOwned",
            "type": "u64"
          },
          {
            "name": "storageUsed",
            "type": "u64"
          },
          {
            "name": "storagePaidUntil",
            "type": "i64"
          },
          {
            "name": "reputationScore",
            "type": "u32"
          }
        ]
      }
    }
  ]
} as const;

export type SoldriveIDL = typeof SOLDRIVE_IDL;
