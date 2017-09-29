# Unhash Server

> Provide file-hosting and be paid using open standards

## Getting Started

To set up an Unhash Server, follow these steps:

### Step 1: Get a testnet account

In order to receive money, you need an account on a **ledger**. This can be any
ILP-supported ledger like Bitcoin or Ethereum, but for this guide, we are using
the XRP testnet. You can get a free account with some testnet XRP here:
[XRP Test Net](https://ripple.com/build/ripple-test-net/)

Simply click on "Generate credentials" and write down the "SECRET".

### Step 2: Get the software

Next, we need to download the software. The easiest way to get Unhash Server and
all the dependencies is with Docker:

``` sh
docker pull justmoon/unhash-server
```

### Step 3: Run it!

Finally, we need to run Unhash Server. Here is an example command you can use:

``` sh
export UNHASH_HOSTS='["localhost:3000"]'
docker run -it --rm --name my-unhash-server -p 3000:3000 -e UNHASH_ILP_CREDENTIALS='{"server":"wss://s.altnet.rippletest.net:51233","secret":"ss6YmrV2dNNPLjzqgdjSvktJvz5Vs"}' -e DEBUG=* justmoon/unhash-server
```

**Note:** Please replace `[your testnet secret]` with the "SECRET" you got in Step 1.
