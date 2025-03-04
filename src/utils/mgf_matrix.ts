/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/mgf_matrix.json`.
 */
export const MgfMatrix = {
  "address": "HR5LPG1EYDrL5YL12P9exaXXusjMGKrRyLrLBpFibcBR",
  "metadata": {
    "name": "mgfMatrix",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buy",
      "discriminator": [
        102,
        6,
        61,
        18,
        1,
        218,
        235,
        234
      ],
      "accounts": [
        {
          "name": "clmmProgram",
          "address": "devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH"
        },
        {
          "name": "payer",
          "docs": [
            "The user performing the swap"
          ],
          "signer": true
        },
        {
          "name": "ammConfig",
          "docs": [
            "The factory state to read protocol fees"
          ]
        },
        {
          "name": "poolState",
          "docs": [
            "The program account of the pool in which the swap will be performed"
          ],
          "writable": true
        },
        {
          "name": "inputTokenAccount",
          "docs": [
            "The user token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputTokenAccount",
          "docs": [
            "The user token account for output token"
          ],
          "writable": true
        },
        {
          "name": "inputVault",
          "docs": [
            "The vault token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputVault",
          "docs": [
            "The vault token account for output token"
          ],
          "writable": true
        },
        {
          "name": "observationState",
          "docs": [
            "The program account for the most recent oracle observation"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL program for token transfers"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenProgram2022",
          "docs": [
            "SPL program 2022 for token transfers"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "memoProgram",
          "docs": [
            "memo program"
          ],
          "address": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        },
        {
          "name": "inputVaultMint",
          "docs": [
            "The mint of token vault 0"
          ]
        },
        {
          "name": "outputVaultMint",
          "docs": [
            "The mint of token vault 1"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "otherAmountThreshold",
          "type": "u64"
        },
        {
          "name": "sqrtPriceLimitX64",
          "type": "u128"
        }
      ]
    },
    {
      "name": "createPool",
      "discriminator": [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188
      ],
      "accounts": [
        {
          "name": "minter",
          "writable": true,
          "signer": true
        },
        {
          "name": "platformPoolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "ammConfig",
          "docs": [
            "Which config the pool belongs to."
          ]
        },
        {
          "name": "poolState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "ammConfig"
              },
              {
                "kind": "account",
                "path": "tokenMint0"
              },
              {
                "kind": "account",
                "path": "tokenMint1"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenMint0",
          "docs": [
            "Token_0 mint, the key must grater then token_1 mint."
          ]
        },
        {
          "name": "tokenMint1",
          "docs": [
            "Token_1 mint"
          ]
        },
        {
          "name": "tokenVault0",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "account",
                "path": "tokenMint0"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "tokenVault1",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "account",
                "path": "tokenMint1"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "observationState",
          "writable": true
        },
        {
          "name": "tickArrayBitmap",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  116,
                  105,
                  99,
                  107,
                  95,
                  97,
                  114,
                  114,
                  97,
                  121,
                  95,
                  98,
                  105,
                  116,
                  109,
                  97,
                  112,
                  95,
                  101,
                  120,
                  116,
                  101,
                  110,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "docs": [
            "To create a new program account"
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clmmProgram",
          "address": "devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH"
        },
        {
          "name": "rent",
          "docs": [
            "Sysvar for program account"
          ],
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sqrtPriceX64",
          "type": "u128"
        },
        {
          "name": "openTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositPool",
      "discriminator": [
        187,
        244,
        122,
        76,
        155,
        46,
        239,
        194
      ],
      "accounts": [
        {
          "name": "clmmProgram",
          "address": "devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH"
        },
        {
          "name": "minter",
          "docs": [
            "Pays to mint the position"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "platformPoolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenMint0"
        },
        {
          "name": "tokenMint1"
        },
        {
          "name": "positionNftMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  110,
                  102,
                  116,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              },
              {
                "kind": "account",
                "path": "platformPoolAuthority"
              }
            ]
          }
        },
        {
          "name": "positionNftAccount",
          "docs": [
            "This account created in the contract by cpi to avoid large stack variables"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  110,
                  102,
                  116,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "metadataAccount",
          "docs": [
            "To store metaplex metadata"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  110,
                  102,
                  116,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              },
              {
                "kind": "account",
                "path": "platformPoolAuthority"
              }
            ]
          }
        },
        {
          "name": "poolState",
          "docs": [
            "Add liquidity for this pool"
          ],
          "writable": true
        },
        {
          "name": "protocolPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "arg",
                "path": "tickLowerIndex"
              },
              {
                "kind": "arg",
                "path": "tickUpperIndex"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "tickArrayLower",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  99,
                  107,
                  95,
                  97,
                  114,
                  114,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "arg",
                "path": "tickArrayLowerStartIndex"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "tickArrayUpper",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  105,
                  99,
                  107,
                  95,
                  97,
                  114,
                  114,
                  97,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "arg",
                "path": "tickArrayUpperStartIndex"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "personalPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "positionNftMint"
              }
            ],
            "program": {
              "kind": "account",
              "path": "clmmProgram"
            }
          }
        },
        {
          "name": "tokenAccount0",
          "docs": [
            "The token_0 account deposit token to the pool"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "minter"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint0"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenAccount1",
          "docs": [
            "The token_1 account deposit token to the pool"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "minter"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint1"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenVault0",
          "docs": [
            "The address that holds pool tokens for token_0"
          ],
          "writable": true
        },
        {
          "name": "tokenVault1",
          "docs": [
            "The address that holds pool tokens for token_1"
          ],
          "writable": true
        },
        {
          "name": "rent",
          "docs": [
            "Sysvar for token mint and ATA creation"
          ],
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "docs": [
            "Program to create the position manager state account"
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "Program to create an ATA for receiving position NFT"
          ],
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "metadataProgram",
          "docs": [
            "Program to create NFT metadata"
          ],
          "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Program to create mint account and mint tokens"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "vault0Mint",
          "docs": [
            "The mint of token vault 0"
          ]
        },
        {
          "name": "vault1Mint",
          "docs": [
            "The mint of token vault 1"
          ]
        }
      ],
      "args": [
        {
          "name": "tickLowerIndex",
          "type": "i32"
        },
        {
          "name": "tickUpperIndex",
          "type": "i32"
        },
        {
          "name": "tickArrayLowerStartIndex",
          "type": "i32"
        },
        {
          "name": "tickArrayUpperStartIndex",
          "type": "i32"
        },
        {
          "name": "liquidity",
          "type": "u128"
        },
        {
          "name": "amount0Max",
          "type": "u64"
        },
        {
          "name": "amount1Max",
          "type": "u64"
        },
        {
          "name": "withMatedata",
          "type": "bool"
        },
        {
          "name": "baseFlag",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "initPlatform",
      "discriminator": [
        29,
        22,
        210,
        225,
        219,
        114,
        193,
        169
      ],
      "accounts": [
        {
          "name": "platformAdmin",
          "writable": true,
          "signer": true,
          "address": "mqtj8nemKcW1y3fQhBz6ENWNsiHGqZ5M3ySmefokEnJ"
        },
        {
          "name": "platformMintAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "platformTokenAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "platformTokenTransferFeeAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "platformPoolAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintToken",
      "discriminator": [
        172,
        137,
        183,
        14,
        207,
        110,
        234,
        56
      ],
      "accounts": [
        {
          "name": "minter",
          "writable": true,
          "signer": true
        },
        {
          "name": "platformMintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "platformTokenAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "platformTokenAccount",
          "writable": true
        },
        {
          "name": "platformTokenTransferFeeAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114,
                  95,
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "mintAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "metadata",
          "type": {
            "defined": {
              "name": "tokenMetadataArgs"
            }
          }
        }
      ]
    },
    {
      "name": "sell",
      "discriminator": [
        51,
        230,
        133,
        164,
        1,
        127,
        131,
        173
      ],
      "accounts": [
        {
          "name": "clmmProgram",
          "address": "devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH"
        },
        {
          "name": "payer",
          "docs": [
            "The user performing the swap"
          ],
          "signer": true
        },
        {
          "name": "ammConfig",
          "docs": [
            "The factory state to read protocol fees"
          ]
        },
        {
          "name": "poolState",
          "docs": [
            "The program account of the pool in which the swap will be performed"
          ],
          "writable": true
        },
        {
          "name": "inputTokenAccount",
          "docs": [
            "The user token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputTokenAccount",
          "docs": [
            "The user token account for output token"
          ],
          "writable": true
        },
        {
          "name": "inputVault",
          "docs": [
            "The vault token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputVault",
          "docs": [
            "The vault token account for output token"
          ],
          "writable": true
        },
        {
          "name": "observationState",
          "docs": [
            "The program account for the most recent oracle observation"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL program for token transfers"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenProgram2022",
          "docs": [
            "SPL program 2022 for token transfers"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "memoProgram",
          "docs": [
            "memo program"
          ],
          "address": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        },
        {
          "name": "inputVaultMint",
          "docs": [
            "The mint of token vault 0"
          ]
        },
        {
          "name": "outputVaultMint",
          "docs": [
            "The mint of token vault 1"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "otherAmountThreshold",
          "type": "u64"
        },
        {
          "name": "sqrtPriceLimitX64",
          "type": "u128"
        }
      ]
    },
    {
      "name": "updateTransferFee",
      "discriminator": [
        135,
        106,
        57,
        77,
        93,
        247,
        210,
        158
      ],
      "accounts": [
        {
          "name": "minter",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "platformCranker",
          "address": "FSUe5MMWfHTuzdsEgSWNcbtt2akgSqKovJbwts6FYt2W",
          "writable": true
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "tokenParams",
          "type": {
            "defined": {
              "name": "tokenParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ammConfig",
      "discriminator": [
        218,
        244,
        33,
        104,
        203,
        203,
        43,
        111
      ]
    },
    {
      "name": "observationState",
      "discriminator": [
        122,
        174,
        197,
        53,
        129,
        9,
        165,
        132
      ]
    },
    {
      "name": "platformMintAuthority",
      "discriminator": [
        235,
        225,
        175,
        212,
        75,
        98,
        188,
        123
      ]
    },
    {
      "name": "platformPoolAuthority",
      "discriminator": [
        235,
        244,
        138,
        78,
        246,
        210,
        91,
        249
      ]
    },
    {
      "name": "platformTokenAuthority",
      "discriminator": [
        250,
        95,
        25,
        132,
        114,
        191,
        153,
        237
      ]
    },
    {
      "name": "platformTokenTransferFeeAuthority",
      "discriminator": [
        48,
        48,
        224,
        28,
        170,
        44,
        199,
        183
      ]
    },
    {
      "name": "poolState",
      "discriminator": [
        247,
        237,
        227,
        245,
        215,
        195,
        222,
        70
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "transferFeeTooHigh",
      "msg": "TransferFeeTooHigh max 900 bps"
    }
  ],
  "types": [
    {
      "name": "ammConfig",
      "docs": [
        "Holds the current owner of the factory"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump to identify PDA"
            ],
            "type": "u8"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "owner",
            "docs": [
              "Address of the protocol owner"
            ],
            "type": "pubkey"
          },
          {
            "name": "protocolFeeRate",
            "docs": [
              "The protocol fee"
            ],
            "type": "u32"
          },
          {
            "name": "tradeFeeRate",
            "docs": [
              "The trade fee, denominated in hundredths of a bip (10^-6)"
            ],
            "type": "u32"
          },
          {
            "name": "tickSpacing",
            "docs": [
              "The tick spacing"
            ],
            "type": "u16"
          },
          {
            "name": "fundFeeRate",
            "docs": [
              "The fund fee, denominated in hundredths of a bip (10^-6)"
            ],
            "type": "u32"
          },
          {
            "name": "paddingU32",
            "type": "u32"
          },
          {
            "name": "fundOwner",
            "type": "pubkey"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u64",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "observation",
      "docs": [
        "The element of observations in ObservationState"
      ],
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "blockTimestamp",
            "docs": [
              "The block timestamp of the observation"
            ],
            "type": "u32"
          },
          {
            "name": "sqrtPriceX64",
            "docs": [
              "the price of the observation timestamp, Q64.64"
            ],
            "type": "u128"
          },
          {
            "name": "cumulativeTimePriceX64",
            "docs": [
              "the cumulative of price during the duration time, Q64.64"
            ],
            "type": "u128"
          },
          {
            "name": "padding",
            "docs": [
              "padding for feature update"
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "observationState",
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "docs": [
              "Whether the ObservationState is initialized"
            ],
            "type": "bool"
          },
          {
            "name": "poolId",
            "type": "pubkey"
          },
          {
            "name": "observations",
            "docs": [
              "observation array"
            ],
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "observation"
                  }
                },
                1000
              ]
            }
          },
          {
            "name": "padding",
            "docs": [
              "padding for feature update"
            ],
            "type": {
              "array": [
                "u128",
                5
              ]
            }
          }
        ]
      }
    },
    {
      "name": "platformMintAuthority",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "platformPoolAuthority",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "platformTokenAuthority",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "platformTokenTransferFeeAuthority",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "poolState",
      "docs": [
        "The pool state",
        "",
        "PDA of `[POOL_SEED, config, token_mint_0, token_mint_1]`",
        ""
      ],
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump to identify PDA"
            ],
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "ammConfig",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tokenMint0",
            "docs": [
              "Token pair of the pool, where token_mint_0 address < token_mint_1 address"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint1",
            "type": "pubkey"
          },
          {
            "name": "tokenVault0",
            "docs": [
              "Token pair vault"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenVault1",
            "type": "pubkey"
          },
          {
            "name": "observationKey",
            "docs": [
              "observation account key"
            ],
            "type": "pubkey"
          },
          {
            "name": "mintDecimals0",
            "docs": [
              "mint0 and mint1 decimals"
            ],
            "type": "u8"
          },
          {
            "name": "mintDecimals1",
            "type": "u8"
          },
          {
            "name": "tickSpacing",
            "docs": [
              "The minimum number of ticks between initialized ticks"
            ],
            "type": "u16"
          },
          {
            "name": "liquidity",
            "docs": [
              "The currently in range liquidity available to the pool."
            ],
            "type": "u128"
          },
          {
            "name": "sqrtPriceX64",
            "docs": [
              "The current price of the pool as a sqrt(token_1/token_0) Q64.64 value"
            ],
            "type": "u128"
          },
          {
            "name": "tickCurrent",
            "docs": [
              "The current tick of the pool, i.e. according to the last tick transition that was run."
            ],
            "type": "i32"
          },
          {
            "name": "observationIndex",
            "docs": [
              "the most-recently updated index of the observations array"
            ],
            "type": "u16"
          },
          {
            "name": "observationUpdateDuration",
            "type": "u16"
          },
          {
            "name": "feeGrowthGlobal0X64",
            "docs": [
              "The fee growth as a Q64.64 number, i.e. fees of token_0 and token_1 collected per",
              "unit of liquidity for the entire life of the pool."
            ],
            "type": "u128"
          },
          {
            "name": "feeGrowthGlobal1X64",
            "type": "u128"
          },
          {
            "name": "protocolFeesToken0",
            "docs": [
              "The amounts of token_0 and token_1 that are owed to the protocol."
            ],
            "type": "u64"
          },
          {
            "name": "protocolFeesToken1",
            "type": "u64"
          },
          {
            "name": "swapInAmountToken0",
            "docs": [
              "The amounts in and out of swap token_0 and token_1"
            ],
            "type": "u128"
          },
          {
            "name": "swapOutAmountToken1",
            "type": "u128"
          },
          {
            "name": "swapInAmountToken1",
            "type": "u128"
          },
          {
            "name": "swapOutAmountToken0",
            "type": "u128"
          },
          {
            "name": "status",
            "docs": [
              "Bitwise representation of the state of the pool",
              "bit0, 1: disable open position and increase liquidity, 0: normal",
              "bit1, 1: disable decrease liquidity, 0: normal",
              "bit2, 1: disable collect fee, 0: normal",
              "bit3, 1: disable collect reward, 0: normal",
              "bit4, 1: disable swap, 0: normal"
            ],
            "type": "u8"
          },
          {
            "name": "padding",
            "docs": [
              "Leave blank for future use"
            ],
            "type": {
              "array": [
                "u8",
                7
              ]
            }
          },
          {
            "name": "rewardInfos",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "rewardInfo"
                  }
                },
                3
              ]
            }
          },
          {
            "name": "tickArrayBitmap",
            "docs": [
              "Packed initialized tick array state"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          },
          {
            "name": "totalFeesToken0",
            "docs": [
              "except protocol_fee and fund_fee"
            ],
            "type": "u64"
          },
          {
            "name": "totalFeesClaimedToken0",
            "docs": [
              "except protocol_fee and fund_fee"
            ],
            "type": "u64"
          },
          {
            "name": "totalFeesToken1",
            "type": "u64"
          },
          {
            "name": "totalFeesClaimedToken1",
            "type": "u64"
          },
          {
            "name": "fundFeesToken0",
            "type": "u64"
          },
          {
            "name": "fundFeesToken1",
            "type": "u64"
          },
          {
            "name": "openTime",
            "type": "u64"
          },
          {
            "name": "padding1",
            "type": {
              "array": [
                "u64",
                25
              ]
            }
          },
          {
            "name": "padding2",
            "type": {
              "array": [
                "u64",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "rewardInfo",
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardState",
            "docs": [
              "Reward state"
            ],
            "type": "u8"
          },
          {
            "name": "openTime",
            "docs": [
              "Reward open time"
            ],
            "type": "u64"
          },
          {
            "name": "endTime",
            "docs": [
              "Reward end time"
            ],
            "type": "u64"
          },
          {
            "name": "lastUpdateTime",
            "docs": [
              "Reward last update time"
            ],
            "type": "u64"
          },
          {
            "name": "emissionsPerSecondX64",
            "docs": [
              "Q64.64 number indicates how many tokens per second are earned per unit of liquidity."
            ],
            "type": "u128"
          },
          {
            "name": "rewardTotalEmissioned",
            "docs": [
              "The total amount of reward emissioned"
            ],
            "type": "u64"
          },
          {
            "name": "rewardClaimed",
            "docs": [
              "The total amount of claimed reward"
            ],
            "type": "u64"
          },
          {
            "name": "tokenMint",
            "docs": [
              "Reward token mint."
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenVault",
            "docs": [
              "Reward vault token account."
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "The owner that has permission to set reward param"
            ],
            "type": "pubkey"
          },
          {
            "name": "rewardGrowthGlobalX64",
            "docs": [
              "Q64.64 number that tracks the total tokens earned per unit of liquidity since the reward",
              "emissions were turned on."
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "tokenMetadataArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "tokenParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transferFeeBps",
            "type": "i16"
          },
          {
            "name": "distributeFeeBps",
            "type": "i16"
          },
          {
            "name": "burnFeeBps",
            "type": "i16"
          },
          {
            "name": "tokenRewardMint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "distributionInterval",
            "type": {
              "option": "i32"
            }
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "crankerFee",
      "type": "u64",
      "value": "10000000"
    },
    {
      "name": "memeDecimals",
      "type": "u8",
      "value": "6"
    },
    {
      "name": "memeSupply",
      "type": "u64",
      "value": "1000000000"
    },
    {
      "name": "poolConfig",
      "type": "pubkey",
      "value": "CQYbhr6amxUER4p5SC44C63R4qw4NFc9Z4Db9vF4tZwG"
    },
    {
      "name": "raydiumProgram",
      "type": "pubkey",
      "value": "devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH"
    },
    {
      "name": "solMint",
      "type": "pubkey",
      "value": "So11111111111111111111111111111111111111112"
    },
    {
      "name": "usdcMint",
      "type": "pubkey",
      "value": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    }
  ]
};
