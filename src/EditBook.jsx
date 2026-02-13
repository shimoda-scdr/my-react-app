// src/EditBook.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useParams, useNavigate ,useLocation} from 'react-router-dom'; // URLのパラメータ取得用
import { 
    Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Image, Textarea
} from '@chakra-ui/react';


export default function EditBook() {
  const { id } = useParams(); // URLの :id の部分を取得
  const navigate = useNavigate(); // ページ移動用
  const location = useLocation();
  const toast = useToast();
  
  const initialBook = location.state?.book;
  const [score, setScore] = useState(initialBook?.score || '');
  const [review, setReview] = useState(initialBook?.review || '');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [currentImage, setCurrentImage] = useState(''); // 今の画像URL
  const [newFile, setNewFile] = useState(null); // 新しくアップする画像

  // 画面が開いたら、その本のデータを読み込む
  useEffect(() => {
    const getBook = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id) // IDが一致するものを探す
        .single();    // 1件だけ取得

      if (error) {
        toast({ title: 'エラー', description: 'データの取得に失敗しました', status: 'error' });
      } else {
        setTitle(data.title);
        setReview(data.review || '');
        setScore(data.score || '');
        setCurrentImage(data.cover_url);
      }
    };
    getBook();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = currentImage;

      // もし新しい画像が選ばれていたら、アップロードしてURLを更新
      if (newFile) {
        const fileExt = newFile.name.split('.').pop();
        const fileName = `cover-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, newFile);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // データベースを更新 (Update)
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
            title: title,
            review: review,
            score: score,
            cover_url: imageUrl }) // 更新する内容
        .eq('id', id); // どのデータを更新するか

      if (updateError) throw updateError;

      toast({ title: '更新完了', status: 'success', duration: 3000 });
      navigate('/'); // トップページに戻る

    } catch (error) {
      console.error(error);
      toast({ title: 'エラー', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if(!window.confirm("本当に削除しますか？")) return;
    
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (!error) {
      toast({ title: '削除しました', status: 'info' });
      navigate('/');
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">編集画面</Heading>
        
        {/* 今の画像を表示 */}
        {currentImage && (
            <Box textAlign="center">
                <Image src={currentImage} maxH="200px" mx="auto" borderRadius="md" />
            </Box>
        )}

        <Box as="form" onSubmit={handleUpdate} p={6} borderWidth={1} borderRadius="lg" bg="white">
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>タイトル修正</FormLabel>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormControl>

            {/*点数編集*/}
            <FormControl>
              <FormLabel>点数</FormLabel>
              <Input 
                type="number" 
                value={score} 
                onChange={(e) => setScore(e.target.value)} 
                max={100}
              />
            </FormControl>
            
            /* ★感想編集エリア */
            <FormControl>
              <FormLabel>感想</FormLabel>
              <Textarea 
                value={review} 
                onChange={(e) => setReview(e.target.value)} 
                rows={6}
              />
            </FormControl>

            <FormControl>
              <FormLabel>画像の変更（変更する場合のみ選択）</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => setNewFile(e.target.files[0])} p={1} />
            </FormControl>

            <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>
              更新を保存
            </Button>
            
            <Button colorScheme="red" variant="outline" width="full" onClick={handleDelete}>
              この本を削除
            </Button>
            
            <Button variant="ghost" width="full" onClick={() => navigate('/')}>
              キャンセルして戻る
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}