import { MapView, patchScript, unitDir } from './lib.mjs';
const T = (text) => ({ type: 'title', text });
const run = (code, key, scenes, where) => { const d = unitDir(code); patchScript(`${d}/video/script.yaml`, key, scenes, where); return d; };

// ---------- RE02-01 ユダヤ教の誕生と歴史：苦難の歴史を地図で ----------
{
  const d = unitDir('RE02-01');
  const m = new MapView({ bbox: [-10, 24, 52, 46] });
  const base = m.baseEl(d, 'map-history.svg');
  const J = [35.2, 31.8];
  const jer = { lon: J[0], lat: J[1], r: 10 };
  const scene = {
    board: 'whiteboard',
    steps: [
      { say: 'ここまでの歴史を、地図でたどってみましょう。ユダヤ人の故郷は、地中海の東のはし、今のイスラエルのあたりで、エルサレムは、その中心です。',
        show: [T('地図でたどる、ユダヤ人の歴史'), { ...base, id: 'base' }, m.overlayEl({ fill: { Israel: 'yellow' }, points: [jer] }, { id: 'ov1' }),
          m.label('エルサレム', J[0], J[1], 'yellow', 24, -14), m.label('地中海', 17, 34.3, 'gray', 0, 0)] },
      { say: 'まず、出エジプト。エジプトで奴隷として働かされていたユダヤ人は、モーセに率いられて、シナイ半島を通り、故郷のカナンの地へ向かったとされます。',
        show: [m.overlayEl({ fill: { Egypt: 'green' }, routes: [{ pts: [[31.8, 30.8], [32.6, 29.9], [33.7, 28.7], [34.6, 30.3], [35.0, 31.5]], color: 'green', dash: true }] }, { id: 'ov2' }),
          m.label('エジプト', 28, 28.2, 'green', 0, 0), m.label('シナイ半島', 33.0, 28.0, 'green', -10, 6)].map((e, i) => (i ? { ...e, id: 'l2' + i } : e)) },
      { say: '次に、バビロン捕囚。紀元前6世紀、新バビロニアにほろぼされ、多くの人が、バビロン、今のイラクにある都市へ、連れて行かれました。',
        hide: ['ov2', 'l21', 'l22'],
        show: [m.overlayEl({ fill: { Iraq: 'blue' }, routes: [{ pts: [[35.2, 31.8], [36.7, 34.5], [39.5, 35.8], [42.0, 34.6], [44.3, 32.6]], color: 'blue' }], points: [{ lon: 44.4, lat: 32.5, color: 'blue' }] }, { id: 'ov3' }),
          { ...m.label('バビロン', 44.4, 32.5, 'blue', -110, 16), id: 'l3' }] },
      { say: 'そして、ディアスポラ。西暦70年に、ローマ帝国がエルサレムを破壊すると、ユダヤ人は、ローマ、北アフリカ、スペインなど、地中海の各地へ、さらに、ヨーロッパ全体へと、散らばっていきました。',
        hide: ['ov3', 'l3', 'ov1'],
        show: [m.overlayEl({ fill: { Israel: 'yellow' }, routes: [
          { pts: [J, [20, 38], [12.5, 41.9]], color: 'pink' }, { pts: [J, [20, 33.5], [3, 36], [-4.8, 37.8]], color: 'pink' },
          { pts: [J, [29.9, 31.2]], color: 'pink' }], points: [jer] }, { id: 'ov4' }),
          m.label('ローマ', 12.5, 41.9, 'pink', -20, -44), m.label('スペイン', -8.5, 40.2, 'pink', 0, -4), m.label('北アフリカ', 10, 30, 'pink', 0, 0)] },
    ],
  };
  run('RE02-01', 'map', [scene], { afterSay: 'ディアスポラのあと' });
}

// ---------- RE02-04 エルサレムとユダヤ教：エルサレムはどこ？ ----------
{
  const d = unitDir('RE02-04');
  const wide = new MapView({ bbox: [24, 21, 62, 43] });
  const near = new MapView({ bbox: [33.2, 29.4, 37.0, 33.8] });
  const J = [35.22, 31.78];
  const scene = {
    board: 'whiteboard',
    steps: [
      { say: 'ところで、エルサレムは、どこにあるのでしょうか。世界地図の中では、アジアの西のはし、地中海の東の岸に近い場所です。',
        show: [T('エルサレムはどこ？'), { ...wide.baseEl(d, 'map-jerusalem-wide.svg'), id: 'w0' },
          wide.overlayEl({ fill: { Israel: 'yellow', Palestine: 'yellow' }, points: [{ lon: J[0], lat: J[1], r: 11 }] }, { id: 'w1' }),
          wide.label('エルサレム', J[0], J[1], 'yellow', -170, -64), wide.label('地中海', 27, 34.2, 'gray', 0, 0),
          wide.label('エジプト', 28, 26.5, 'white', 0, 0), wide.label('サウジアラビア', 42, 25, 'white', 0, 0), wide.label('トルコ', 31, 39.3, 'white', 0, 0), wide.label('イラン', 52, 32, 'white', 0, 0)] },
      { say: 'もう少し、拡大してみます。エルサレムは、地中海の海岸から、およそ50キロメートル、内陸に入った、標高700メートルをこえる丘の上にあります。すぐ東には、死海があります。',
        hide: ['w0', 'w1'],
        show: [{ ...near.baseEl(d, 'map-jerusalem-near.svg'), id: 'n0' },
          near.overlayEl({ points: [{ lon: J[0], lat: J[1], r: 11 }] }, { id: 'n1' }),
          near.label('エルサレム', J[0], J[1], 'yellow', 16, -14), near.label('地中海', 33.6, 32.6, 'gray', 0, 0), near.label('死海', 35.5, 31.4, 'blue', 14, -10),
          near.label('ヨルダン', 36.0, 31.2, 'white', 0, 0), near.label('エジプト', 33.4, 29.8, 'white', 0, 0)] },
      { say: 'このせまい範囲に、ユダヤ教、キリスト教、イスラム教、3つの宗教の聖地が、集まっているのです。',
        show: [{ type: 'text', color: 'yellow', text: '地中海から約50km・標高700m超の丘の上 ／ 3つの宗教の聖地が集まる', at: [100, 668], size: 's' }] },
    ],
  };
  run('RE02-04', 'map', [scene], { afterSay: '嘆きの壁は' });
}


// ---------- RE04-01 イスラム教の誕生：拡大を地図で ----------
{
  const d = unitDir('RE04-01');
  const m = new MapView({ bbox: [-14, 8, 76, 48] });
  const A1 = ['Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait'];
  const A2 = ['Syria', 'Lebanon', 'Jordan', 'Israel', 'Palestine', 'Iraq', 'Iran', 'Egypt'];
  const A3 = ['Libya', 'Tunisia', 'Algeria', 'Morocco', 'W. Sahara', 'Spain', 'Portugal', 'Afghanistan', 'Pakistan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Armenia', 'Azerbaijan'];
  const f = (names, c) => Object.fromEntries(names.map((n) => [n, c]));
  const mecca = [39.8, 21.4];
  const scene = {
    board: 'whiteboard',
    steps: [
      { say: 'その後の、およそ100年で、イスラム勢力は、シリア、エジプト、ペルシャ、北アフリカ、そして、スペインにまで、広がりました。地図で、ようすを見てみましょう。',
        show: [T('イスラム教の急速な拡大'), { ...m.baseEl(d, 'map-expansion.svg'), id: 'base' },
          m.label('地中海', 12, 34.8, 'gray', 0, 0)] },
      { say: 'はじまりは、アラビア半島の、メッカとメディナです。632年にムハンマドが亡くなるころには、アラビア半島の大部分が、イスラム教のもとに、まとまっていました。',
        show: [m.overlayEl({ fill: f(A1, 'yellow'), points: [{ lon: mecca[0], lat: mecca[1], r: 9 }, { lon: 39.6, lat: 24.5, r: 9 }] }, { id: 'o1' }),
          m.label('メッカ・メディナ', 28, 20.2, 'yellow', 0, 0), m.label('632年', 44, 14.8, 'yellow', 0, 0)] },
      { say: 'ムハンマドの死後、後継者のカリフたちのもとで、シリア、イラク、エジプト、ペルシャが、およそ30年のあいだに、つぎつぎと、支配下に入りました。',
        show: [m.overlayEl({ fill: f(A2, 'green'), routes: [{ pts: [[39.7, 24.5], [36, 31.5], [35, 34]], color: 'green' }, { pts: [[39.7, 24.5], [32.5, 28], [30, 30.5]], color: 'green' }, { pts: [[39.7, 24.5], [44, 31], [50, 33]], color: 'green' }] }, { id: 'o2' }),
          m.label('〜661年', 52.5, 29.5, 'green', 0, 0)] },
      { say: 'つづく、ウマイヤ朝の時代には、さらに西へ、北アフリカをこえて、ジブラルタル海峡をわたり、スペインまで。東は、中央アジアや、今のパキスタンのあたりまで、広がりました。',
        show: [m.overlayEl({ fill: f(A3, 'blue'), routes: [{ pts: [[30, 30.5], [10, 33], [-6, 35.7], [-4, 38]], color: 'blue' }, { pts: [[50, 33], [62, 36], [68, 40]], color: 'blue' }, { pts: [[50, 33], [62, 30], [68, 27]], color: 'blue' }] }, { id: 'o3' }),
          m.label('〜750年ごろ', -12, 14, 'blue', 0, 0)] },
      { say: 'ただし、732年、フランスのトゥール・ポワティエ間の戦いで、フランク王国に阻まれ、ヨーロッパの中心への進出は、止まりました。',
        show: [m.overlayEl({ points: [{ lon: 0.34, lat: 46.6, r: 9, color: 'pink' }] }, { id: 'o4' }), m.label('トゥール・ポワティエ間の戦い（732年）', 0.34, 46.6, 'pink', 26, -10)] },
    ],
  };
  run('RE04-01', 'map', [scene], { replaceSay: 'およそ100年で、イスラム勢力は' });
}

// ---------- RE06-02 エルサレムをめぐる争いの歴史：イスラエルとエルサレムの範囲 ----------
{
  const d = unitDir('RE06-02');
  const m = new MapView({ bbox: [33.6, 29.3, 36.9, 33.7] });
  const J = [35.22, 31.78];
  // schematic map of Jerusalem (not to scale): Green Line (1949) divides West / East
  const z = new MapView({ bbox: [35.08, 31.66, 35.38, 31.87], plain: true });
  const west = [[35.11, 31.70], [35.215, 31.70], [35.218, 31.78], [35.222, 31.85], [35.11, 31.85]];
  const east = [[35.215, 31.70], [35.30, 31.70], [35.34, 31.74], [35.33, 31.82], [35.28, 31.85], [35.222, 31.85], [35.218, 31.78]];
  const old = [[35.2255, 31.7735], [35.2400, 31.7735], [35.2400, 31.7845], [35.2255, 31.7845]];
  const scene = {
    board: 'whiteboard',
    steps: [
      { say: 'ここで、今のイスラエルと、エルサレムの場所を、地図で確認しておきましょう。',
        show: [T('イスラエルとエルサレムの範囲'), { ...m.baseEl(d, 'map-israel.svg'), id: 'm0' }] },
      { say: '黄色い部分が、イスラエルです。緑色の、ヨルダン川西岸と、ガザ地区は、パレスチナ人が多く住む地域です。エルサレムは、イスラエルとヨルダン川西岸の、境目あたりにあります。',
        show: [m.overlayEl({ fill: { Israel: 'yellow', Palestine: 'green' }, points: [{ lon: J[0], lat: J[1], r: 10, color: 'pink' }] }, { id: 'm1' }),
          m.label('イスラエル', 34.9, 30.6, 'yellow', 60, 0), m.label('ヨルダン川西岸', 35.35, 32.4, 'green', 14, -6), m.label('ガザ地区', 34.25, 31.4, 'green', -170, -4),
          m.label('エルサレム', J[0], J[1], 'pink', 20, 4), m.label('地中海', 33.9, 32.9, 'gray', 0, 0)] },
      { say: 'エルサレムの中は、1949年の停戦ラインより西が、西エルサレム、東が、旧市街をふくむ、東エルサレムです。1967年の戦争で、イスラエルは、この東側も、占領しました。',
        hide: ['m0', 'm1'],
        show: [{ ...z.baseEl(d, 'map-jerusalem-city.svg'), id: 'z0' },
          z.overlayEl({ polys: [{ ring: west, color: 'blue', opacity: 0.3 }, { ring: east, color: 'pink', opacity: 0.3 }, { ring: old, color: 'yellow', opacity: 0.6 }], routes: [{ pts: [[35.217, 31.70], [35.219, 31.78], [35.222, 31.85]], color: 'white', dash: true, arrow: false, width: 3 }] }, { id: 'z1' }),
          z.label('西エルサレム', 35.13, 31.77, 'blue', 0, 0), z.label('東エルサレム', 35.24, 31.73, 'pink', 0, 0),
          z.label('旧市街', 35.243, 31.784, 'yellow', 0, 0), z.label('停戦ライン（1949年）', 35.098, 31.84, 'white', 0, 0), z.label('※概念図（おおよその位置・縮尺は正確ではありません）', 35.09, 31.69, 'gray', 0, 0)] },
    ],
  };
  run('RE06-02', 'map', [scene], { beforeSay: '1948年に、イスラエルが建国されると' });
}


// ---------- RE01-02 世界の宗教の分布：なぜ無宗教が増えているのか ----------
run('RE01-02', 'why', [{
  board: 'whiteboard',
  steps: [
    { say: 'では、なぜ、無宗教の人が増えているのでしょうか。理由は、ひとつではありませんが、おもに4つの流れが指摘されています。', show: [T('なぜ無宗教が増えているのか')] },
    { say: 'ひとつ目は、科学と教育の広まりです。自然のしくみや病気の原因が、科学で説明できるようになり、宗教に答えを求める場面が、少なくなりました。',
      show: [{ type: 'box', color: 'blue', w: 1100, title: '① 科学と教育の広まり', text: '自然現象や病気を科学で説明できる → 宗教に答えを求める場面が減る' }] },
    { say: 'ふたつ目は、社会が豊かで、安全になったことです。医療や年金、保険などの制度が整うと、病気や老後への不安を、宗教ではなく、社会のしくみで支えられるようになります。',
      show: [{ type: 'box', color: 'green', w: 1100, title: '② 豊かで安全な社会', text: '医療・年金・保険などの制度が、不安をやわらげる → 宗教への依存が減る' }] },
  ] }, { board: 'whiteboard', steps: [
    { say: 'みっつ目は、都市化と、個人主義の広がりです。地域や家族のつながりがうすれ、教会やお寺に通う習慣が、親から子へ、受けつがれにくくなりました。',
      show: [T('なぜ無宗教が増えているのか（つづき）'), { type: 'box', color: 'pink', w: 1100, title: '③ 都市化と個人主義', text: '地域・家族のつながりがうすれる → 信仰が世代を超えて受けつがれにくい' }] },
    { say: 'よっつ目は、宗教団体への不信です。不祥事や、宗教が争いの原因になってきた歴史が、宗教そのものへの、距離感につながっている、とも言われます。',
      added: true, show: [{ type: 'box', color: 'yellow', w: 1100, title: '④ 宗教団体への不信', text: '不祥事や、宗教がからむ争いへの失望 → 組織や宗教から距離を置く人が増える' }] },
    { say: 'ただし、世界全体で見ると、信者の多い地域ほど、人口が増えているため、宗教を持つ人の割合は、今後も、大きくは減らない、という予測もあります。',
      added: true, show: [{ type: 'text', color: 'gray', text: '先進国では無宗教が増える一方、世界全体では宗教人口の割合は大きくは減らないという予測もある' }] },
  ],
}], { afterSay: '無宗教の人も、世界の人口' });

// ---------- RE01-03 一神教と多神教：ちがいが何につながるか ----------
const pair = (l, r) => [{ type: 'box', color: 'blue', at: [60, 200], w: 560, title: '一神教', text: l }, { type: 'box', color: 'green', at: [660, 200], w: 560, title: '多神教', text: r }];
run('RE01-03', 'diff', [
  { board: 'whiteboard', steps: [
    { say: 'では、この、神の数のちがいは、具体的に、宗教のあり方の、どんなちがいにつながるのでしょうか。4つの点で、くらべてみましょう。ひとつ目は、神と世界の関係です。',
      show: [T('ちがい① 神と世界の関係')] },
    { say: '一神教では、神は、世界をつくった、ただひとりの存在で、人間は、その神に従う立場です。多神教では、山や海、太陽など、自然のあちこちに神がいて、世界は、神々といっしょに、成り立っています。',
      show: pair('神は、世界をつくった唯一の存在。人間は、神に従う立場', '山・海・太陽など、自然のあちこちに神がいる。神々といっしょに世界がある') }] },
  { board: 'whiteboard', steps: [
    { say: 'ふたつ目は、教えの中心です。一神教では、聖書やコーランなど、聖典の言葉を、どう信じるかが、重く見られます。多神教では、お祭りや儀式など、何をするかが中心で、信じる内容は、あまり問われません。',
      show: [T('ちがい② 教えの中心'), ...pair('聖典の教え（教義）を、正しく信じることが大切', '祭り・儀式・習慣など、「行うこと」が中心。信じる内容は問われにくい')] }] },
  { board: 'whiteboard', steps: [
    { say: 'みっつ目は、ほかの宗教との関係です。一神教では、ほかの神を認めにくいので、信者を増やす布教や、改宗が、大切にされます。多神教では、ほかの神も、受け入れやすく、日本の、神仏習合のように、混ざり合うことがあります。',
      show: [T('ちがい③ ほかの宗教との関係'), ...pair('ほかの神を認めにくい。布教・改宗が大切にされる', 'ほかの神も取り入れやすい。日本の神仏習合のように混ざり合う')] }] },
  { board: 'whiteboard', steps: [
    { say: 'よっつ目は、世界の見方です。一神教には、神が世界を始め、いつか終わらせる、という、直線的な歴史の見方があり、最後の審判の考え方もあります。多神教では、季節のように、くり返す世界の見方が、多く見られます。',
      show: [T('ちがい④ 世界の見方'), ...pair('始まりと終わりがある直線的な歴史。最後の審判', '季節のようにくり返す世界（循環）。輪廻の考え方も')] }] },
  { board: 'whiteboard', steps: [
    { say: 'ただし、これは、あくまで、大まかな傾向です。多神教の社会でも争いはありましたし、一神教の国でも、ほかの宗教に、寛容な時代がありました。ちがいを、単純に善悪で語らないことが、大切です。',
      added: true, show: [T('ただし、単純にはいえない'), { type: 'box', color: 'pink', w: 1100, text: '大まかな傾向にすぎない。多神教でも争いはあり、一神教にも寛容な時代があった（例：イスラム支配下のスペイン）' }] }] },
], { end: true });
console.log('religion all ok');
