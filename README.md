# ThanhPN_adblock
thanhpn adblock 

# NextDNS/Adguard recommended
https://github.com/yokoffing/NextDNS-Config?tab=readme-ov-file

https://github.com/hl2guide/AdGuard-Home-Whitelist/blob/main/USAGE.md

# whitelist
https://github.com/anudeepND/whitelist/tree/master/domains

https://github.com/hg1978/AdGuard-Home-Whitelist/blob/master/whitelist.txt


# blacklist/blocklist/Denylist 
Denylist 

# ---------------------------------------------------

## Blocklists <sup><sup>[1](https://github.com/nextdns/blocklists/tree/main/blocklists)</sup></sup>

Blocklists filter out ads, [trackers](https://www.freecodecamp.org/news/what-you-should-know-about-web-tracking-and-how-it-affects-your-online-privacy-42935355525/), and malicious sites. Hundreds of volunteers contribute to these lists in the [open-source](https://opensource.com/resources/what-open-source) community, and they are the undercover heroes who make blocking ads at scale possible.

We recommend you **remove** the [NextDNS Ads & Trackers Blocklist](https://github.com/nextdns/blocklists/blob/main/blocklists/nextdns-recommended.json) and **add** the [minimum](https://www.reddit.com/r/nextdns/comments/1048xeg/do_you_use_nextdns_blocklist_as_the_primary/j33wnz2/?context=3) number of useful lists.

### Which blocklist should I use?

A great question to ask is: "How much do I want to deal with the inconveniences of [false positives](https://csrc.nist.gov/glossary/term/false_positive)?"

Here are the suggested blocklists, based on past issues and observations:

|     **Blocklists**   |                              **Rationale**                                             |
|:--------------------:|:--------------------------------------------------------------------------------------:|
| HaGeZi - <br>Multi **NORMAL**<sup>[1](https://github.com/hagezi/dns-blocklists/blob/main/statistics.md#multi)</sup> <p><p>OISD</p> | Block tracker, ad, and badware requests without issues ([set-and-forget](https://glosbe.com/en/en/set-and-forget)). |
| HaGeZi - <br>Multi **PRO**<sup>[2](https://github.com/hagezi/dns-blocklists/blob/main/statistics.md#pro)</sup> <p><p>OISD</p> | Block more requests, usually without issues (recommended). |
| HaGeZi - <br>Multi **PRO++**<sup>[3](https://github.com/hagezi/dns-blocklists/blob/main/statistics.md#proplus)</sup> <p><p>OISD</p> | Block more requests at the risk of site breakage. <br> [Report](https://github.com/hagezi/dns-blocklists/issues/new/choose) occasional site and app issues. |

> [!TIP]
> Use different blocklists on separate DNS profiles (e.g., NORMAL for your router and PRO++ for your web browser).

> [!NOTE]
>  NextDNS does not offer Hagezi's Threat Intelligence Feed (TIF). We suggest using the OISD list, which contains some TIF sources missing from NextDNS security features.

You can also check out Hagezi's own [recommendations](https://github.com/hagezi/dns-blocklists/tree/main#whatshouldiuse).

### Why Hagezi?
[Hagezi](https://github.com/hagezi/dns-blocklists) block ads, trackers, native device trackers, and badware. He maintains a sensible allowlist, handles false positives quickly, and communicates known issues to blocklists maintainers. Hagezi's primary DNS lists combine multiple [sources](https://github.com/hagezi/dns-blocklists/wiki/FAQ#-which-sources-are-used-for-the-lists-and-how-are-the-lists-compiled-on-the-basis-of-these-sources) including respected community blocklists like [OISD](https://oisd.nl/), [Steven Black](https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts), [1Hosts](https://github.com/badmojr/1Hosts#safeguard-your-devices-against-pesky-ads-trackers-and-malware), [notrack](https://gitlab.com/quidsup/notrack#notrack), and [more](https://github.com/hagezi/dns-blocklists/blob/main/sources.md).

You may also wonder why other lists are not utilized. This is because many list maintainers:
* do not remove [false positives](https://csrc.nist.gov/glossary/term/false_positive) and/or are no longer active <sup>[1](https://github.com/lightswitch05/hosts/issues/356) [2](https://github.com/EnergizedProtection/block/issues/916)</sup>
* already [aggregate](https://www.reddit.com/r/nextdns/comments/ys3s1s/confused_about_blocklists/ivxdcd2/?context=3) common blocklists into their own list (Easylist/Fanboy, AdGuard, Steven Black, etc.) <sup>[1](https://github.com/badmojr/1Hosts/blob/master/-data/lists/assets.txt) [2](https://oisd.nl/includedlists/big/0) [3](https://github.com/jerryn70/GoodbyeAds/blob/master/Docs/Sources.md) [4](https://github.com/hagezi/dns-blocklists/blob/main/sources.md#sources) </sup>
* offer no meaningful additional coverage when compared with the chart combinations above

## Native Tracking Protection <sup><sup>[1](https://github.com/nextdns/native-tracking-domains/tree/main/domains)</sup></sup>

Add all the device brands you use.

<details>

	Windows
	Apple
	Samsung
	Xiaomi
	Huawei
	Amazon Alexa
	Roku
	Sonos

</details>

# Settings :gear:

## Logs
**Storage location** → Switzerland

## Block Page
> [!CAUTION]
> Enabling this setting may cause site navigation issues if the [NextDNS Root CA](https://help.nextdns.io/t/g9hmv0a/how-to-install-and-trust-nextdns-root-ca) is not on your devices. Also, this setting breaks [Paypal 2FA](https://github.com/hagezi/dns-blocklists/issues/2335), [iCloud Private Relay](https://help.nextdns.io/t/g9hdska), [Microsoft Teams](https://www.reddit.com/r/nextdns/comments/176u2x6/comment/k4pp3ti/?context=3), [Yahoo! Mail](https://github.com/hagezi/dns-blocklists/issues/269#issuecomment-1409644343), the NAVER app, [Hoyolab app](https://help.nextdns.io/t/g9yxqcd/nextdns-blocking-hoyolab), and possibly [banking apps](https://help.nextdns.io/t/83yxjgx/most-common-problem-with-nextdns).

![Disabled](https://raw.githubusercontent.com/yokoffing/NextDNS-Config/main/icons/disabled.svg) Enable Block Page

## Anonymized EDNS Client Subnet <sup><sup>[1](https://help.nextdns.io/t/m1hmv04/what-is-edns-client-subnet-ecs) </sup></sup>
![Enabled](https://raw.githubusercontent.com/yokoffing/NextDNS-Config/main/icons/enabled.svg) Enable Anonymized EDNS Client Subnet
## Cache Boost <sup><sup>[1](https://www.reddit.com/r/nextdns/comments/girmcf/new_setting_cache_boost/)</sup></sup>
![Enabled](https://raw.githubusercontent.com/yokoffing/NextDNS-Config/main/icons/enabled.svg) Enable Cache Boost

## CNAME Flattening <sup><sup>[1](https://medium.com/nextdns/nextdns-added-cname-uncloaking-support-becomes-the-first-cross-platform-solution-to-the-problem-e3f437f84342) [2](https://developers.cloudflare.com/dns/cname-flattening/) [3](https://advancedweb.hu/what-is-cname-flattening-and-how-it-helps-redirecting-the-apex-domain) </sup></sup>
> [!WARNING]
> Enabling this feature may break compatibility with [Yahoo! Mail](https://github.com/hagezi/dns-blocklists/issues/269#issuecomment-1409644343) and cause issues with certain blocklists.

![Disabled](https://raw.githubusercontent.com/yokoffing/NextDNS-Config/main/icons/disabled.svg) Enable CNAME Flattening

## Web3 <sup><sup> [1](https://x.com/NextDNS/status/1491034351391305731) [2](https://gabygoldberg.notion.site/f7050e62461143d49345e7b46eb5576b)</sup></sup>
![Enabled](https://raw.githubusercontent.com/yokoffing/NextDNS-Config/main/icons/enabled.svg) Enable Web3 → (optional)

***
# FAQ :question:

## How do I signup for NextDNS?
Click [here](https://nextdns.io/?from=xujj63g5) to get started.

## Why am I still seeing ads?
Not all ads can be blocked at the DNS level.<sup>[1](https://www.reddit.com/r/nextdns/comments/14nsfhv/comment/jq982bi/?context=3) [2](https://www.reddit.com/r/nextdns/comments/13urdda/ads_on_manga_sites/)</sup> You will need an [ad blocker](https://github.com/yokoffing/NextDNS-Config#i-need-a-browser-with-ad-blocking-which-one-should-i-choose) to block what's leftover.

This is because not all ads come from third-party domains; some ads come directly from the site you're visiting, like [YouTube](https://discourse.pi-hole.net/t/how-do-i-block-ads-on-youtube/253/2). DNS blockers stop the resolution of a domain, and content blockers filter page content. Click [here](https://github.com/yokoffing/NextDNS-Config/tree/main#i-need-a-browser-with-ad-blocking-which-one-should-i-choose) to easily install a lightweight ad blocker.

## I need a browser with ad blocking. Which one should I choose?
Choosing a browser is about as intimate as [choosing a starter Pokémon](https://www.youtube.com/watch?v=F_8htiBjTCY), so here's a few caveats:
* The best browser on paper may not work well in real world usage.
* Browsers are tools! Use a variety of browsers depending on what you need to do.
* You should use various browsers (or browser profiles) for different areas of life (e.g., work, school, personal).

We based the recommendations below on a combination of effectiveness, resource efficiency, features, and ease of use.

| OS | Browser | Content Blocker |
|---|---|---|
| iOS | [Safari](https://www.privacyguides.org/en/mobile-browsers/#safari) | [AdGuard](https://www.privacyguides.org/en/browser-extensions/?h=adguard#adguard) |
| Android | [Brave](https://www.privacyguides.org/en/mobile-browsers/#brave) | Built-in blocker |
| Windows <br> macOS <br> Linux | [Firefox](https://www.mozilla.org/en-US/firefox/new/) (with [Betterfox](https://github.com/yokoffing/Betterfox#betterfox)) <p><p> [Brave](https://www.privacyguides.org/en/desktop-browsers/#brave) | [uBlock Origin](https://addons.mozilla.org/blog/ublock-origin-everything-you-need-to-know-about-the-ad-blocker/) <p><p> Built-in blocker or [uBlock Origin](https://addons.mozilla.org/blog/ublock-origin-everything-you-need-to-know-about-the-ad-blocker/) |  |

At the end of the day, if you're using [NextDNS](https://nextdns.io/?from=xujj63g5) + any browser with an ad blocker, you have more coverage than most people.

## Should I pay for NextDNS?
For the rich features it provides, [NextDNS](https://nextdns.io/?from=xujj63g5) is very affordable at $19.90/year for unlimited devices. NextDNS pays for itself if it saves my family from a malicious incident.

## Does the amount of features enabled affect the speed of NextDNS?<sup>[1](https://github.com/yokoffing/NextDNS-Config/issues/12#issue-1465457977) [2](https://www.reddit.com/r/nextdns/comments/135utai/comment/jilbus8/?=&context=3)</sup>

The number of settings you toggle on will not affect your DNS latency.

## Do I need to set DoH at browser-level if I already use NextDNS at system-level?
Unless you use a separate profile for the browser, it is [not neccessary](https://www.reddit.com/r/nextdns/comments/yfjvqy/is_it_redundant_to_set_at_doh_at_browserlevel_if/iu3vjzt/?context=3). However, I recommend [setting it in your web browser](https://itechtics.com/dns-over-https/#how-to-enable-or-disable-dns-over-https-in-your-browsers) anyway. 

## I have a router profile and a device profile. Which one does my device use?
The device will use the profile set by the [NextDNS](https://nextdns.io/?from=xujj63g5) app or the installed [root CA](https://help.nextdns.io/t/g9hmv0a/how-to-install-and-trust-nextdns-root-ca). However, if the device has not been configured to use a separate profile, then it will use the wifi/router configuration.<sup>[1](https://www.reddit.com/r/nextdns/comments/yf4hnv/question_about_home_router_and_app_running_in/)</sup>

## What is the difference between security, privacy, and anonymity?
See [article](https://thenewoil.org/en/guides/prologue/secprivanon/) | [video](https://www.youtube.com/watch?v=Wpkh-hfULgE)

## Does NextDNS hide activity from my Internet Service Provider (ISP)?
Encrypted DNS queries boost privacy and security. This encryption stops your ISP from seeing what websites you search for and visit.

However, encrypted DNS does not hide website IP addresses from your ISP. While your ISP cannot see the specific domain you want to access, they can see that you contact DNS servers like Cloudflare or AWS. If you repeatedly send data to a certain IP address, your ISP can guess you are visiting a website at that address.

## Do I need a VPN?
IVPN [argues](https://www.ivpn.net/blog/why-you-dont-need-a-vpn/) you only need a VPN for three reasons. Mainly, in order to:

1. Hide your real IP address from websites and peer-to-peer networks, which prevents ISPs and mobile carriers from tracking your online activity.

2. Guard against [man in the middle](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) and other [common attacks](https://en.wikipedia.org/wiki/Evil_twin_(wireless_networks)) on public Wi-Fi networks in places like airports, hotels, cafes, and libraries.

3. Bypass censorship or geographic restrictions, allowing you to access blocked websites and content.

Ultimately, you don't need a VPN unless your [threat model](https://thenewoil.org/en/guides/prologue/threat-model/) demands it. Here are VPN suggestions from [Techlore](https://www.techlore.tech/vpn.html) and [Tom Spark Reviews](https://www.vpntierlist.com/vpn-tier-list-2024) if it does.

***
# Mentions :books:

### User Comments
* See [here](https://socialgrep.com/search?query=yokoffing%2Cnextdns)

### YouTube
* [The ULTIMATE Guide to Mastering NextDNS!](https://www.youtube.com/watch?v=WUG57ynLb8I&t=2230s) | [clarifications](https://github.com/techlore/channel-content/issues/43) (July 2023) 

### Articles
* [Knot Resolver — with ad blocking](https://blog.cavelab.dev/2022/12/knot-resolver-ad-blocking/) (Dec 2022)
* [Privacy Toolkit: NextDNS](https://stephenbolen.com/privacy-toolkit-nextdns/#:~:text=I%20found%20a%20wonderful%20guide%20on%20GitHub%20that%20walks%20through%20the%20optimal%20NextDNS%20configuration) (Sept 2022)

### Guides
* [A comprehensive guide to setting up NextDNS](https://itsjake.me/blog/a-comprehensive-guide-to-setting-up-nextdns/) (Sept 2023)
* [FMHY: DNS Adblocking](https://github.com/nbats/FMHYedit/blob/main/AdblockVPNGuide.md#-dns-adblocking) → NextDNS → Guide
* [hagezi/dns-blocklists](https://github.com/hagezi/dns-blocklists#department_store-nextdns---limited-freepaid-) → Online DNS Services

### Contributions
* [Hagezi](https://github.com/hagezi/dns-blocklists/issues?q=author%3Ayokoffing) | [mentions](https://github.com/hagezi/dns-blocklists/issues?q=mentions%3Ayokoffing)
* [1Hosts](https://github.com/badmojr/1Hosts/issues?q=author%3Ayokoffing)
* [Easylist](https://github.com/easylist/easylist/issues?q=author%3Ayokoffing)
* [uBlock Origin](https://github.com/uBlockOrigin/uAssets/issues?q=author%3Ayokoffing)
* [AdGuard](https://github.com/AdguardTeam/AdguardFilters/issues?q=author%3Ayokoffing)

<div align='center'><a href='https://websitecounterfree.com'><img src='https://websitecounterfree.com/c.php?d=9&id=19651&s=1' border='0' alt='Free Website Counter'></a><br / ></div>
<div align='center'>since 23 July 2022</div>
